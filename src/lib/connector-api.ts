import { supabase } from "@/integrations/supabase/client";

const PROXY_BASE = "/api/proxy";

export const CONNECTOR_PROVIDERS: Record<string, string> = {
  canva: "canva",
  figma: "figma",
  github: "github",
  notion: "notion",
  "google-drive": "google",
  "google-photos": "google",
};

export const PENDING_CONNECTOR_KEY = "vedaapex-pending-connector";

export function getConnectorProvider(connectorId: string): string {
  return CONNECTOR_PROVIDERS[connectorId] || connectorId;
}

/**
 * Resolve the bearer token the same way the rest of the app does:
 * Supabase session first, then the backend auth_token cookie, then
 * localStorage tokens.
 */
async function getAuthToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) return data.session.access_token;
  } catch {
    // ignore Supabase session errors, fall back to stored tokens
  }

  if (typeof window !== "undefined") {
    try {
      const cookie = document.cookie
        .split("; ")
        .find((c) => c.startsWith("auth_token="));
      if (cookie) {
        const raw = cookie.slice("auth_token=".length);
        if (raw) return decodeURIComponent(raw);
      }
      return (
        window.localStorage.getItem("accessToken") ||
        window.localStorage.getItem("token")
      );
    } catch {
      return null;
    }
  }
  return null;
}

export type ConnectorLoginResult =
  | { ok: true; authUrl: string }
  | { ok: false; error: string };

/**
 * The backend builds provider authorization URLs from its own config.
 * Some of them carry domain typos (e.g. `accounts.canva.com` instead of
 * the real Canva OAuth host), which only shows up as a DNS error when the
 * popup opens. Normalize the known-bad hosts to the correct ones.
 */
function normalizeAuthUrl(url: string): string {
  const fixes: Array<[string, string]> = [
    ["accounts.canva.com", "www.canva.com"],
  ];
  let result = url;
  for (const [bad, good] of fixes) {
    if (result.includes(bad)) result = result.replace(bad, good);
  }
  return result;
}

/**
 * Start the OAuth flow for a connector. The backend requires a bearer
 * token on the login endpoint, so we call it via the proxy with the
 * Authorization header and extract the provider's authorization URL from
 * the 302 Location header or the JSON body. The URL is then opened in a
 * popup, and the connection is confirmed by polling /status.
 */
export async function startConnectorLogin(connectorId: string): Promise<ConnectorLoginResult> {
  const provider = getConnectorProvider(connectorId);
  const token = await getAuthToken();
  if (!token) {
    return { ok: false, error: "Please log in first to connect a service." };
  }

  try {
    const res = await fetch(`${PROXY_BASE}/connectors/${encodeURIComponent(provider)}/login`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      redirect: "manual",
      cache: "no-store",
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) return { ok: true, authUrl: normalizeAuthUrl(location) };
      return { ok: false, error: "The service login did not return an authorization URL." };
    }

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (typeof data?.message === "string" && data.message) ||
        (typeof data?.detail === "string" && data.detail) ||
        (res.status === 401 ? "Authentication failed. Please log in again." : `Login failed (${res.status}).`);
      return { ok: false, error: message };
    }

    const d = data?.data && typeof data.data === "object" ? data.data : data;
    const authUrl =
      (typeof d?.auth_url === "string" && d.auth_url) ||
      (typeof d?.authUrl === "string" && d.authUrl) ||
      (typeof d?.url === "string" && d.url) ||
      (typeof d?.redirect_url === "string" && d.redirect_url) ||
      (typeof d?.redirectUrl === "string" && d.redirectUrl) ||
      (typeof d?.login_url === "string" && d.login_url) ||
      (typeof d?.authorize_url === "string" && d.authorize_url) ||
      (typeof d?.redirect === "string" && d.redirect);

    if (authUrl) return { ok: true, authUrl: normalizeAuthUrl(authUrl) };

    return { ok: false, error: "The service login response did not include an authorization URL." };
  } catch (error) {
    console.warn(`[Connector] Login request failed for ${provider}:`, error);
    return { ok: false, error: "Could not reach the service. Please try again." };
  }
}

export async function checkConnectorStatus(connectorId: string): Promise<boolean> {
  const provider = getConnectorProvider(connectorId);
  const token = await getAuthToken();
  try {
    const res = await fetch(
      `${PROXY_BASE}/connectors/${encodeURIComponent(provider)}/status`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      }
    );
    if (!res.ok) return false;
    const data = await res.json().catch(() => null);
    const d = data?.data && typeof data.data === "object" ? data.data : data;
    if (!d || typeof d !== "object") return false;
    return Boolean(
      d.connected === true ||
        d.is_connected === true ||
        d.isConnected === true ||
        d.authorized === true ||
        d.connected_at ||
        d.connection_id ||
        String(d.status || "").toLowerCase() === "connected" ||
        String(d.status || "").toLowerCase() === "active"
    );
  } catch (error) {
    console.warn(`[Connector] Status check failed for ${provider}:`, error);
    return false;
  }
}

export async function disconnectConnector(connectorId: string): Promise<boolean> {
  const provider = getConnectorProvider(connectorId);
  const token = await getAuthToken();
  try {
    const res = await fetch(
      `${PROXY_BASE}/connectors/${encodeURIComponent(provider)}/disconnect`,
      { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      console.warn(`[Connector] Disconnect failed for ${provider}:`, body || res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[Connector] Disconnect request failed for ${provider}:`, error);
    return false;
  }
}

export function setPendingConnector(connectorId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_CONNECTOR_KEY, connectorId);
}

export function getPendingConnector(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(PENDING_CONNECTOR_KEY);
}

export function clearPendingConnector() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(PENDING_CONNECTOR_KEY);
}
