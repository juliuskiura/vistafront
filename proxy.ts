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
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
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

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isAsset = isAssetPath(pathname);
  const isPublic = isPublicPath(pathname);
  const hasAccessToken = !!request.cookies.get("access")?.value;
  const hasRefreshToken = !!request.cookies.get("refresh")?.value;

  // Never intercept assets or RSC internals.
  if (isAsset) {
    return NextResponse.next();
  }

  // On the login route: if the user is already signed in and there's a
  // captured destination, clear the cookie and send them there. Otherwise
  // let the login page render.
  if (pathname === "/login") {
    if (hasAccessToken) {
      const nextUrl = request.cookies.get(AUTH_NEXT_URL_COOKIE)?.value;
      if (nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")) {
        const res = NextResponse.redirect(new URL(nextUrl, request.url));
        res.cookies.delete(AUTH_NEXT_URL_COOKIE);
        return res;
      }
      return NextResponse.next();
    }
    return NextResponse.next();
  }

  // Public/auth routes are always allowed.
  if (isPublic) {
    return NextResponse.next();
  }

  // Protected routes: if the user has no access token, capture the intended
  // URL so they can be returned here after signing in. If they also have no
  // refresh token, redirect to /login immediately. If a refresh token exists,
  // let the request through — `requireAuth`/`getAuthUser` will try to refresh
  // the expired access token and only fall back to /login if that fails (the
  // cookie already holds the destination).
  if (!hasAccessToken) {
    const destination = `${pathname}${search}`;
    if (destination && destination !== "/" && !isPublic) {
      const res = hasRefreshToken
        ? NextResponse.next()
        : NextResponse.redirect(new URL("/login", request.url));
      res.cookies.set(AUTH_NEXT_URL_COOKIE, destination, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
      return res;
    }

    if (!hasRefreshToken) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
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
