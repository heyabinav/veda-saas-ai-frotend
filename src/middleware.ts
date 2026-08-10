import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getSupabaseSessionToken(request: NextRequest): string | null {
  const cookie = request.cookies.getAll().find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
  if (!cookie) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(cookie.value));
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

function isTokenUnexpired(accessToken: string): boolean {
  try {
    const payload = JSON.parse(Buffer.from(accessToken.split(".")[1] ?? "", "base64").toString());
    return typeof payload.exp === "number" ? payload.exp * 1000 > Date.now() : true;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const publicRoute = isPublicRoute(pathname);

  // Fast local auth check — no network round-trip to Supabase on navigation.
  // Equivalent to the previous `supabase.auth.getUser()` but without the
  // per-request server call that made every page load slow.
  const supabaseToken = getSupabaseSessionToken(request);
  const isLoggedIn =
    Boolean(request.cookies.get("auth_token")?.value) ||
    Boolean(supabaseToken && isTokenUnexpired(supabaseToken));

  // Logged-in user on a public route → send home
  if (isLoggedIn && publicRoute) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // Not logged in on a protected route → force login
  if (!isLoggedIn && !publicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `redirectTo=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|js|css)$).*)",
  ],
};
