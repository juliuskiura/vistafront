import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_NEXT_URL_COOKIE = "auth_next_url";
const AUTH_CHECK_PATH = "/api/auth/check";

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

// Keep in sync with AUTH_PATH_PREFIXES in app/api/auth/check/route.ts —
// divergence sends that page's recovery down the protected-page branch and
// reintroduces the /login redirect loop this list guards against.
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
 * True for the Next BFF layer — `app/api/.../route.ts` — i.e. the endpoints
 * Client Components call with `fetch()`. `/api/auth/check` is excluded because
 * it is the refresh handler, not a client-facing endpoint.
 */
function isBffPath(pathname: string): boolean {
  return pathname.startsWith("/api/") && pathname !== AUTH_CHECK_PATH;
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

/**
 * Send the request through the /api/auth/check Route Handler WITHOUT the
 * browser ever going there.
 *
 * `NextResponse.rewrite` resolves the target internally and only the
 * handler's final response reaches the client, so the address bar keeps
 * showing the page the user asked for. A `NextResponse.redirect` to the same
 * path would put `/api/auth/check` in the URL bar on every stale-session page
 * load, which is both ugly and a needless disclosure of an internal endpoint.
 *
 * `intended` is the path of the request being recovered. The handler prefers
 * it under framework versions that expose the rewritten URL; this build hands
 * the handler the ORIGINAL request URL instead, where the same path is
 * already `request.nextUrl.pathname` — the parameter is the portable path,
 * and `destinationFor` in the route handler documents both shapes.
 *
 * The target is still built from `request.url` — that is safe here, unlike in
 * a `Location` header, because a rewrite is a routing decision made inside
 * this same process and never leaves the server.
 */
function rewriteToAuthCheck(
  request: NextRequest,
  intended?: string,
): NextResponse {
  const url = new URL(AUTH_CHECK_PATH, request.url);
  if (intended) url.searchParams.set("intended", intended);
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isDjangoApiPath = pathname === "/apis" || pathname.startsWith("/apis/");

  if (pathname !== "/" && pathname.endsWith("/") && !isDjangoApiPath) {
    const canonicalUrl = request.nextUrl.clone();
    canonicalUrl.pathname = pathname.slice(0, -1);
    return NextResponse.redirect(canonicalUrl, 308);
  }

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

  // ── BFF Route Handlers ──────────────────────────────────────────────
  // `/api/*` is the Next BFF layer that Client Components `fetch()` from
  // (TanStack Query queryFns, event handlers, the chat widget). It is NOT
  // gated here, and that is deliberate.
  //
  // The stale-session branch below answers with a 307 to a *page*. For a
  // `fetch()` that is useless: the caller follows the redirect and ends up
  // with an HTML document where it expected JSON. That is why a long-lived tab
  // used to see `GET /api/socialmanager/platforms → 307` in the logs and then
  // render an empty platform list.
  //
  // So these requests pass straight through. Each handler calls
  // `serverFetch`, which forwards the httpOnly cookies and lets Django enforce
  // auth — nothing is lost by not gating here — and a dead token comes back as
  // `401 + X-Session-Expired` (see `lib/api/route-errors.ts`). The client's
  // `apiFetch` wrapper then calls `router.refresh()`, and *that* is a page
  // request, so it does get the refresh hop.
  if (isBffPath(pathname)) {
    return NextResponse.next();
  }

  // ── Auth pages ──────────────────────────────────────────────────────
  // If the user appears authenticated (access cookie present) and navigates
  // to a sign-in / sign-up / password-reset page, they cannot be trusted to
  // keep their session based on cookie presence alone — a stale/blacklisted
  // access cookie would bounce them to /dashboard, which fails, redirects
  // back to /login, and loops forever.
  //
  // So we route them through /api/auth/check, a Route Handler that validates
  // the session against Django (silently refreshing if needed). The hop exists
  // because the proxy runs on the Edge runtime and has no BACKEND_URL, so it
  // cannot talk to Django itself — NOT because cookies need a Route Handler.
  // Cookies are set and deleted on proxy responses all over this file
  // (see setAuthNextUrl and the dead-session branch below).
  //
  // It is a REWRITE, not a redirect: the browser's URL never changes, so
  // /api/auth/check is an internal implementation detail and never appears in
  // the address bar. `rewriteToAuthCheck` documents the shape.
  if (isAuthPath(pathname)) {
    if (hasAccessToken) {
      return rewriteToAuthCheck(request);
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
    // exists → validate/refresh through the internal /api/auth/check rewrite.
    // If the session is real the handler redirects on to the path THIS
    // request is for; if it is dead it clears the cookies and lands on
    // /login.
    //
    // The recovery destination used to be `auth_next_url`. That cookie is
    // stamped on every protected response — and this Next build strips the
    // RSC/prefetch headers from the proxy's request instance, so a `<Link>`
    // prefetch is indistinguishable from a real navigation here. A prefetched
    // Calendar or Notebook link therefore rewrote the cookie, and the next
    // background session recovery (`router.refresh()` from an `apiFetch`
    // 401) 307'd the user to that prefetched page — a jump to a route they
    // never opened. The request's own path is the only destination that
    // describes where the user actually is.
    //
    // The cookie is deliberately NOT set on this branch: the handler's onward
    // response deletes it, so stamping it on the rewrite was dead weight at
    // best and a stale value that outlived the rewrite at worst.
    if (hasRefreshToken) {
      return rewriteToAuthCheck(request, destination);
    }

    // Dead session: clear the stale cookies and let the request continue.
    //
    // This deliberately does NOT redirect. A relative `Location` is the only
    // way to avoid baking the request's `Host` header into a redirect (see
    // `redirectTo`), but Next re-parses whatever `Location` the proxy returns
    // with `new NextURL(location, { headers, nextConfig })` and no base
    // (`next/dist/server/web/adapter.js`), so a relative one throws
    // `ERR_INVALID_URL` there and the request is downgraded to a 500.
    //
    // Nothing is lost by passing through: every guarded page already redirects
    // itself. `app/(app)/layout.tsx` calls `requireAuth()`, which resolves to
    // `getAuthUser()` → null (no `access` cookie now) → `redirect('/login')`,
    // and `next/navigation`'s `redirect()` emits a valid absolute Location.
    // `auth_next_url` is preserved so `loginAction` can bounce the user back.
    const res = NextResponse.next();
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
