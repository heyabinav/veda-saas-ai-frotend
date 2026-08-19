import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://vedaapex-saas-ai.onrender.com";

async function handleProxy(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const pathSegments = resolvedParams.path;
  const fullPath = pathSegments.join("/");
  const targetPath = (fullPath.startsWith("api/") || fullPath.startsWith("auth/") || fullPath.startsWith("connectors/") || fullPath === "ready" || fullPath === "health")
    ? fullPath
    : `api/${fullPath}`;
  
  const searchParams = req.nextUrl.searchParams.toString();
  const queryString = searchParams ? `?${searchParams}` : "";
  const backendUrl = `${API_BASE_URL.replace(/\/$/, "")}/${targetPath}${queryString}`;

  console.log(`[Proxy] Forwarding ${req.method} request to: ${backendUrl}`);

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    // Copy all headers except host
    if (key.toLowerCase() === "host") return;
    // Skip empty auth headers which can cause the backend to reject the
    // request or treat it as an authenticated request with an empty token.
    if ((key.toLowerCase() === "authorization" || key.toLowerCase() === "x-api-key") && typeof value === "string" && value.trim() === "") {
      return;
    }
    headers.set(key, value);
  });

  let body: any = undefined;
  if (["POST", "PUT", "PATCH"].includes(req.method)) {
    try {
      body = await req.arrayBuffer();
    } catch (e) {
      console.error("[Proxy] Failed to read request body:", e);
    }
  }

  // Timeout for the backend request. Video generation can take 2+ minutes, so
  // wait up to ~5 minutes. NOTE: this only helps if the backend's own Render
  // service has its "Request Timeout" raised too (Settings -> Advanced ->
  // Request Timeout, max 300s, requires a paid instance). On Render's free
  // tier the gateway still hard-caps every request at 60s with a 504.
  const BACKEND_TIMEOUT_MS = 290000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  // Render's free tier spins the instance down after inactivity. The first
  // request to a sleeping instance is often refused/reset at the connection
  // level ("fetch failed") while it boots, which used to surface as an
  // immediate 500. Retry connection-level failures with backoff so the cold
  // start has a chance to complete. HTTP responses (4xx/5xx) are NOT retried —
  // they're real backend answers (e.g. 401) and must pass through as-is.
  const RETRY_DELAYS_MS = [3000, 4000, 6000];

  let response: Response | undefined;
  let lastError: any;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (controller.signal.aborted) break;
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt - 1]));
      if (controller.signal.aborted) break;
    }
    try {
      response = await fetch(backendUrl, {
        method: req.method,
        headers,
        body,
        signal: controller.signal,
        // OAuth login endpoints (e.g. /connectors/{provider}/login) answer
        // with a 302 to the provider's consent page. Without this the
        // redirect chain is followed server-side and the browser never sees
        // the Location header it needs to open the popup window.
        redirect: "manual",
      });
      break;
    } catch (error: any) {
      lastError = error;
      // If the client disconnected or the overall timeout fired, stop retrying.
      if (controller.signal.aborted) break;
      console.warn(`[Proxy] Backend connection attempt ${attempt + 1} failed for ${backendUrl}:`, error.message);
    }
  }

  if (!response) {
    clearTimeout(timeoutId);
    if (lastError?.name === "AbortError") {
      return NextResponse.json({ error: "Backend request timed out (cold start limit exceeded)" }, { status: 504 });
    }
    return NextResponse.json(
      { error: lastError?.message || "Proxy request failed" },
      { status: 502 }
    );
  }

  clearTimeout(timeoutId);

  const responseHeaders = new Headers();
  if (typeof response.headers.getSetCookie === "function") {
    for (const cookie of response.headers.getSetCookie()) {
      responseHeaders.append("set-cookie", cookie);
    }
  }

  response.headers.forEach((value, key) => {
    // The fetch() below already decompresses the body, so re-forwarding the
    // original content-encoding / content-length would corrupt the response
    // the browser receives (broken error bodies, e.g. showing "{}").
    const lower = key.toLowerCase();
    if (lower === "content-encoding" || lower === "content-length" || lower === "transfer-encoding") {
      return;
    }
    if (lower === "set-cookie") {
      return;
    }
    responseHeaders.set(key, value);
  });

  const responseData = await response.arrayBuffer();

  return new NextResponse(responseData, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, { params });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, { params });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, { params });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, { params });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, { params });
}
