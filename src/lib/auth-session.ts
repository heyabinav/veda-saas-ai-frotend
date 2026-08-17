export function readCookieValue(name: string, cookieString?: string): string | null {
  const source = cookieString ?? (typeof document !== "undefined" ? document.cookie : "");
  if (!source) return null;

  const match = source
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  if (!match) return null;

  const value = match.slice(name.length + 1);
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseSupabaseSessionToken(cookieValue?: string | null): string | null {
  if (!cookieValue) return null;

  try {
    const raw = decodeURIComponent(cookieValue);
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed[0]) {
      return typeof parsed[0] === "string"
        ? parsed[0]
        : typeof parsed[0]?.access_token === "string"
          ? parsed[0].access_token
          : null;
    }

    if (parsed && typeof parsed === "object") {
      return typeof parsed.access_token === "string" ? parsed.access_token : null;
    }
  } catch {
    // Ignore malformed session cookies and fall back to the absence of a token.
  }

  return null;
}

export function isPostLoginGraceActive(cookieValue?: string | null): boolean {
  const rawValue = cookieValue ?? readCookieValue("post_login_grace");
  if (!rawValue) return false;

  const timestamp = Number(rawValue);
  if (!Number.isFinite(timestamp)) return false;

  return Date.now() < timestamp;
}

export function setPostLoginGraceCookie(ttlMs = 60_000) {
  if (typeof document === "undefined") return;
  const expiresAt = Date.now() + ttlMs;
  document.cookie = `post_login_grace=${expiresAt}; path=/; max-age=${Math.ceil(ttlMs / 1000)}; SameSite=Lax`;
}
