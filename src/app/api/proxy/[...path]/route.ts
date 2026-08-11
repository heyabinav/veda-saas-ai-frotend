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

  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers,
      body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      // The fetch() below already decompresses the body, so re-forwarding the
      // original content-encoding / content-length would corrupt the response
      // the browser receives (broken error bodies, e.g. showing "{}").
      const lower = key.toLowerCase();
      if (lower === "content-encoding" || lower === "content-length" || lower === "transfer-encoding") {
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
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error("[Proxy] Error forwarding request:", error);
    if (error.name === "AbortError") {
      return NextResponse.json({ error: "Backend request timed out (cold start limit exceeded)" }, { status: 504 });
    }
    return NextResponse.json({ error: error.message || "Proxy request failed" }, { status: 500 });
  }
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
