import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_NEXT_URL_COOKIE = "auth_next_url";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/password",
  "/activate",
  "/verify-email",
  "/restricted",
  "/api/socialmanager/media",
  "/api/auth/check",
];

const AUTH_PATHS = ["/login", "/signup", "/password", "/activate"];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function isAssetPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/images/") ||
    /^\/(.*\.(png|jpg|jpeg|svg|webp|ico|css|js|woff2?))$/i.test(pathname)
  );
}

/**
 * Decode a JWT's payload *without verifying the signature* — just enough to
 * read the `exp` claim. Used to detect an expired-but-still-present `access`
 * cookie so the middleware does not bounce it to /dashboard (which would
 * fail and loop back to /login). Verification is not needed for this check;
 * Django (`/api/auth/check`) still fully validates the token.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(b64));
  } catch {
    return null;
  }
}

/**
 * True when the access cookie's `exp` claim is in the past. Un-decodable or
 * missing `exp` is treated as NOT expired so we never throw away a session
 * we could not verify.
 */
function isAccessExpired(access?: string): boolean {
  if (!access) return false;
  const payload = decodeJwtPayload(access);
  if (!payload || typeof payload.exp !== "number") return false;
  return payload.exp * 1000 <= Date.now();
}

/**
 * Set the `auth_next_url` cookie to capture where the user should be
 * redirected after logging in. The cookie is httpOnly and expires in
 * 10 minutes so stale destinations don't linger.
 */
function setAuthNextUrl(
  response: NextResponse,
  destination: string,
): void {
  response.cookies.set(AUTH_NEXT_URL_COOKIE, destination, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAsset = isAssetPath(pathname);
  const isPublic = isPublicPath(pathname);
  const access = request.cookies.get("access")?.value;
  const refresh = request.cookies.get("refresh")?.value;
  const hasAccessToken = !!access;
  const hasRefreshToken = !!refresh;
  const accessExpired = isAccessExpired(access);

  // Never intercept assets or RSC internals.
  if (isAsset) {
    return NextResponse.next();
  }

  // ── Auth pages ──────────────────────────────────────────────────────
  // If the user appears authenticated (access cookie present) and navigates
  // to a sign-in / sign-up / password-reset page, they cannot be trusted to
  // keep their session based on cookie presence alone — a stale/blacklisted
  // access cookie would bounce them to /dashboard, which fails, redirects
  // back to /login, and loops forever.
  //
  // Instead we send them through /api/auth/check, a Route Handler that
  // validates the session against Django (silently refreshing if needed).
  // If the session is real it redirects to auth_next_url (or /dashboard);
  // if it is dead it clears the stale cookies and redirects to /login.
  if (isAuthPath(pathname)) {
    if (hasAccessToken) {
      return NextResponse.redirect(new URL("/api/auth/check", request.url));
    }
    return NextResponse.next();
  }

  // Public routes that aren't auth pages are always allowed.
  if (isPublic) {
    return NextResponse.next();
  }

  // ── Protected routes ────────────────────────────────────────────────
  // Capture the intended destination on EVERY protected navigation so
  // that if the user is eventually sent to /login, the login action can
  // redirect them back.
  const destination = `${pathname}${search}`;
  const isProtected = destination && destination !== "/" && !isPublic;

  if (isProtected) {
    // USABLE session (access present and not expired) → let it through.
    if (hasAccessToken && !accessExpired) {
      const res = NextResponse.next();
      setAuthNextUrl(res, destination);
      return res;
    }

    // Stale session (no access, or access expired) but a refresh token
    // exists → validate/refresh in /api/auth/check. Route Handlers may set
    // cookies (Server Component render may NOT), so this is the only place
    // a silent refresh can actually persist. On failure the handler clears
    // cookies and lands on /login — no loop possible.
    if (hasRefreshToken) {
      const res = NextResponse.redirect(
        new URL("/api/auth/check", request.url),
      );
      setAuthNextUrl(res, destination);
      return res;
    }

    // Dead session: clear stale cookies and send to login. auth_next_url is
    // preserved so loginAction can bounce the user back to `destination`.
    const res = NextResponse.redirect(new URL("/login", request.url));
    setAuthNextUrl(res, destination);
    res.cookies.delete("access");
    res.cookies.delete("refresh");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals and static assets so the
     * auth gate and destination-capture logic apply uniformly.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
