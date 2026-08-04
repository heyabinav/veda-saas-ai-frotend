import { supabase } from "@/integrations/supabase/client";

const isServer = typeof window === "undefined";

// Use NEXT_PUBLIC_API_BASE_URL or fallback to the Hugging Face space url
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://vedaapex-vedaapex.hf.space";

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

function isTextResponse(contentType: string) {
  const normalized = contentType.toLowerCase();
  return (
    normalized.startsWith("text/") ||
    normalized.includes("application/json") ||
    normalized.includes("+json")
  );
}

async function readErrorBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  try {
    const bytes = await response.arrayBuffer();
    const errorBody = new TextDecoder("utf-8", { fatal: false }).decode(bytes).trim();
    let parsedError: any = null;

    if (isTextResponse(contentType) || errorBody.startsWith("{") || errorBody.startsWith("[")) {
      try {
        parsedError = JSON.parse(errorBody);
      } catch {
        // Ignore parse errors and fall back to the raw decoded body.
      }
    }

    return {
      errorBody: errorBody || `Non-text error response (${contentType || "unknown"}, ${bytes.byteLength} bytes)`,
      parsedError,
    };
  } catch {
    return {
      errorBody: "Failed to read response body",
      parsedError: null,
    };
  }
}

/**
 * Centralized API client fetch wrapper.
 * Handles:
 * - base URL from env
 * - 30s timeout (specifically for HF Space cold starts)
 * - browser CORS by hitting internal Next.js proxy route /api/proxy when in client-side
 * - detailed error body extraction
 * - full error logging (status code + response body)
 */
export async function apiRequest(endpoint: string, options: ApiRequestOptions = {}) {
  // Ensure endpoint starts with '/'
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  // If in browser, request goes through internal Next.js API proxy to avoid CORS
  const targetUrl = isServer
    ? `${BASE_URL.replace(/\/$/, "")}${cleanEndpoint}`
    : `/api/proxy${cleanEndpoint}`;

  // Fetch Supabase session token to authorize request if not already present
  let token: string | undefined;
  try {
    const { data } = await supabase.auth.getSession();
    token = data.session?.access_token;
  } catch (e) {
    console.warn("Could not retrieve Supabase session:", e);
  }

  // Fallback: use the token saved by the real backend login (auth_token cookie)
  if (!token && typeof document !== "undefined") {
    try {
      const match = document.cookie
        .split("; ")
        .find((c) => c.startsWith("auth_token="));
      if (match) {
        const raw = match.slice("auth_token=".length);
        token = decodeURIComponent(raw);
      }
    } catch {
      // ignore cookie read errors
    }
  }

  const headers = new Headers(options.headers);
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Handle timeout (30 seconds)
  const timeoutMs = options.timeoutMs ?? 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(targetUrl, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const { errorBody, parsedError } = await readErrorBody(response);

      // Log status code + full response body as requested
      console.error(`[API Error] Request to ${endpoint} failed. Status: ${response.status}`, {
        status: response.status,
        body: parsedError || errorBody,
      });

      // Propagate the specific backend error message
      const errorMessage =
        parsedError?.detail ||
        parsedError?.message ||
        parsedError?.error ||
        errorBody ||
        `Request failed with status ${response.status}`;

      // If validation error from FastAPI, format it nicely
      if (Array.isArray(parsedError?.detail)) {
        const validationMsg = parsedError.detail
          .map((err: any) => `${err.loc?.join(".") || "field"}: ${err.msg}`)
          .join(", ");
        throw new Error(`Validation Error: ${validationMsg}`);
      }

      throw new Error(errorMessage);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      console.error(`[API Timeout] Request to ${endpoint} timed out after ${timeoutMs / 1000}s`);
      throw new Error(
        `Request timed out after ${timeoutMs / 1000} seconds. This might be due to a Hugging Face Space cold start. Please try again.`
      );
    }
    console.error(`[API Exception] Request to ${endpoint} encountered exception:`, error);
    throw error;
  }
}
