import { supabase } from "@/integrations/supabase/client";

const isServer = typeof window === "undefined";

// Use NEXT_PUBLIC_API_BASE_URL or fallback to the Hugging Face space url
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://vedaapex-saas-ai.onrender.com";

type ApiRequestOptions = RequestInit & {
  timeoutMs?: number;
};

/**
 * Error hints that usually mean a service's API key / credentials are not
 * configured on the backend, instead of a real server fault. The backend
 * surfaces these as generic 500s ("Server crash", "Internal Server Error")
 * which would otherwise confuse users.
 */
const MISSING_API_KEY_HINTS = [
  /api[_ -]?key/i,
  /key not configured/i,
  /not configured/i,
  /missing (api )?key/i,
  /missing credential/i,
  /credentials? (not )?(found|provided|missing|required|configured)/i,
  /(openai|gemini|google|anthropic|claude|stability|fal|replicate|elevenlabs|unsplash|pexels) key/i,
  /server crash/i,
  /internal server error/i,
  /backend (error|failure)/i,
];

export const MISSING_API_KEY_MESSAGE =
  "This service's API key is not configured on the server yet. Please try again later or contact support.";

export function isMissingApiKeyError(message: string | undefined | null): boolean {
  if (!message) return false;
  return MISSING_API_KEY_HINTS.some((re) => re.test(message));
}

export function toFriendlyError(message: string | undefined | null): string {
  return isMissingApiKeyError(message) ? MISSING_API_KEY_MESSAGE : message || "Request failed";
}

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

  // The backend accepts a Supabase Bearer token or an x-api-key.
  // Priority: Supabase session token (preferred by backend), then the
  // backend-issued auth_token cookie, then localStorage tokens, then any
  // stored developer API key.
  let token: string | undefined;
  let apiKey: string | undefined;

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

  // Fallback: tokens stored by OAuth callback / older auth flows
  if (!token && typeof document !== "undefined") {
    try {
      token =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("token") ||
        undefined;
    } catch {
      // ignore localStorage read errors
    }
  }

  // Fallback: developer API key (generated on the /developer page)
  if (typeof document !== "undefined") {
    try {
      apiKey = localStorage.getItem("vedaapex_api_key") || undefined;
    } catch {
      // ignore localStorage read errors
    }
  }

  // Handle timeout (30 seconds)
  const timeoutMs = options.timeoutMs ?? 30000;

  async function doFetch(authHeaders: Headers): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(targetUrl, {
        ...options,
        headers: authHeaders,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // Build headers once, but allow a fresh set on the 401 retry (stale token cleared)
  const buildHeaders = (currentToken: string | undefined, currentApiKey: string | undefined) => {
    const h = new Headers(options.headers);

    // Remove any explicitly-set but empty auth headers so they don't
    // override the token-based headers or cause the backend to treat the
    // request as unauthenticated (some proxies reject empty Authorization).
    const authVal = h.get("Authorization");
    if (typeof authVal === "string" && authVal.trim() === "") {
      h.delete("Authorization");
    }
    const apiKeyVal = h.get("x-api-key");
    if (typeof apiKeyVal === "string" && apiKeyVal.trim() === "") {
      h.delete("x-api-key");
    }

    if (currentToken && !h.has("Authorization")) {
      h.set("Authorization", `Bearer ${currentToken}`);
    }
    if (currentApiKey && !h.has("x-api-key")) {
      h.set("x-api-key", currentApiKey);
    }
    if (!h.has("Content-Type") && !(options.body instanceof FormData)) {
      h.set("Content-Type", "application/json");
    }
    return h;
  };

  let attempt = 0;

  try {
    let response = await doFetch(buildHeaders(token, apiKey));

    // A 401 with a token attached usually means a stale/expired token. Try to
    // refresh the Supabase session once and retry with the fresh token. Only if
    // that fails do we clear the stale credentials, so the app can re-login.
    if (response.status === 401 && attempt === 0 && token) {
      attempt = 1;
      let refreshed = false;
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        const refreshedToken = refreshData.session?.access_token;
        if (!refreshError && refreshedToken) {
          token = refreshedToken;
          refreshed = true;
          response = await doFetch(buildHeaders(token, apiKey));
        }
      } catch {
        // ignore refresh errors — fall through to the 401 error path below
      }

      if (!refreshed && typeof document !== "undefined") {
        try {
          document.cookie = "auth_token=; path=/; max-age=0";
          localStorage.removeItem("accessToken");
          localStorage.removeItem("token");
        } catch {
          // ignore cleanup errors
        }
      }
    }

    if (!response.ok) {
      const { errorBody, parsedError } = await readErrorBody(response);

      // Log 5xx as errors (server faults), but 4xx as warnings — they are
      // business responses (e.g. "daily reward already claimed") that the UI
      // handles gracefully. Skip noisy 401s when no auth was attached.
      const isNoisyGuest401 = response.status === 401 && !token && !apiKey;
      const logFn = response.status >= 500 ? console.error : console.warn;
      if (!isNoisyGuest401) {
        logFn(`[API Error] Request to ${endpoint} failed. Status: ${response.status}`, {
          status: response.status,
          body: parsedError || errorBody,
        });
      }

      // Propagate the specific backend error message. Some endpoints return
      // empty or `{}` error bodies, so only trust string fields and fall back
      // to a readable generic message instead of showing "{}".
      const detail = parsedError?.detail;
      let detailText: string | undefined;
      if (typeof detail === "string") {
        detailText = detail;
      } else if (Array.isArray(detail)) {
        detailText = detail
          .map((err: any) =>
            `${Array.isArray(err?.loc) ? err.loc.join(".") : "field"}: ${err?.msg || JSON.stringify(err)}`
          )
          .join(", ");
      }
      const errorMessage =
        detailText ||
        (typeof parsedError?.message === "string" ? parsedError.message : undefined) ||
        (typeof parsedError?.error === "string" ? parsedError.error : undefined) ||
        (errorBody && errorBody !== "{}" && errorBody !== "" ? errorBody : undefined) ||
        (response.status === 400
          ? "Bad request. Please try again."
          : response.status === 401
            ? "Authentication required. Please log in."
            : `Request failed with status ${response.status}.`);

      // Missing API key / credentials on the backend surface as generic 500s
      // ("Server crash", "Internal Server Error"). Translate those into a
      // clear, actionable message instead of confusing the user.
      const friendlyError =
        response.status >= 500 && isMissingApiKeyError(errorMessage)
          ? MISSING_API_KEY_MESSAGE
          : errorMessage;

      // Attach the HTTP status so callers can detect auth failures (401) and redirect to login
      const error = new Error(friendlyError) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    return response;
  } catch (error: any) {
    if (error.name === "AbortError") {
      console.error(`[API Timeout] Request to ${endpoint} timed out after ${timeoutMs / 1000}s`);
      throw new Error(
        `Request timed out after ${timeoutMs / 1000} seconds. This might be due to a Hugging Face Space cold start. Please try again.`
      );
    }
    // 4xx errors were already logged above (as warnings) and are handled by
    // the callers — logging them again as exceptions just creates console noise
    // for expected business errors like "daily reward already claimed".
    if (!(error?.status && error.status < 500)) {
      console.error(`[API Exception] Request to ${endpoint} encountered exception:`, error);
    }
    throw error;
  }
}
