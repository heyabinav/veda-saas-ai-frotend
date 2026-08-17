import { NextResponse, type NextRequest } from "next/server";

// Routes only for unauthenticated guests (redirect logged-in users to /)
const AUTH_ONLY_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

// Routes accessible to everyone without login
const PUBLIC_ROUTES = [
  "/",
  "/auth/callback",
  "/blog",
  "/explore-vedas",
  "/upgrade",
  "/image-generator",
  "/video-generator",
  "/ppt-generator",
  "/apexcode",
  "/logo-generator",
  "/model-generator",
  "/docs-generator",
  "/excel-generator",
  "/prompt-generator",
  "/bg-remover",
  "/watermark-remover",
  "/wedding-card-generator",
  "/enhancer",
  "/skills",
  "/developer",
  "/file-converter",
  "/recent-files",
  "/files",
  "/library",
];

function isAuthOnlyRoute(pathname: string) {
  return AUTH_ONLY_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function isPublicRoute(pathname: string) {
  if (pathname === "/") return true;
  return PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

function getSupabaseSessionToken(request: NextRequest): string | null {
  const cookie = request.cookies.getAll().find(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
  if (!cookie) return null;
  try {
    const raw = decodeURIComponent(cookie.value);
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed[0]) {
      return typeof parsed[0] === "string" ? parsed[0] : parsed[0]?.access_token || null;
    }
    return typeof parsed?.access_token === "string" ? parsed.access_token : null;
  } catch {
    return null;
  }
}

function isTokenUnexpired(accessToken: string): boolean {
  try {
    const parts = accessToken.split(".");
    if (parts.length < 2) return true;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return typeof payload.exp === "number" ? payload.exp * 1000 > Date.now() : true;
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Fast local auth check
  const supabaseToken = getSupabaseSessionToken(request);
  const isLoggedIn =
    Boolean(request.cookies.get("auth_token")?.value) ||
    Boolean(request.cookies.get("token")?.value) ||
    Boolean(request.cookies.get("vedaapex_user")?.value) ||
    Boolean(supabaseToken && isTokenUnexpired(supabaseToken));

  // Logged-in user on auth pages (/login, /signup, etc.) -> redirect to home
  if (isLoggedIn && isAuthOnlyRoute(pathname)) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  // Not logged in on a protected route -> force login
  if (!isLoggedIn && !isPublicRoute(pathname) && !isAuthOnlyRoute(pathname)) {
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
