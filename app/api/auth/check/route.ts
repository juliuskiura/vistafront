import type { NextRequest } from "next/server";
import { redirectTo } from "@/lib/redirect.server";
import { fetchDjango } from "@/lib/api/django-fetch";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

/**
 * Paths whose proxy flow must keep cookie semantics. Sending a visitor to
 * `/login` (or a sibling auth page) straight back to that same page — the
 * obvious "return them where they came from" — loops forever, because the
 * proxy rewrites them here again on every pass.
 */
// Keep in sync with AUTH_PATHS in proxy.ts — divergence sends that page's
// recovery down the protected-page branch and reintroduces the loop above.
const AUTH_PATH_PREFIXES = ["/login", "/signup", "/password", "/activate"];

/**
 * A candidate recovery destination, reduced to a same-origin path.
 *
 * Anything that is not one — an absolute URL, a protocol-relative `//host`,
 * a value that fails to parse — is rejected, so neither the forwarded
 * `intended` nor the cookie can ever turn this handler into an open redirect.
 */
function sanitizeDestination(
  candidate: string | null | undefined,
): string | null {
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return null;
  }

  try {
    const parsed = new URL(candidate, "https://vistafront.invalid");
    if (parsed.origin !== "https://vistafront.invalid") return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function destinationFor(req: NextRequest): string {
  const fromCookieChain = () =>
    sanitizeDestination(req.nextUrl.searchParams.get("intended")) ??
    sanitizeDestination(req.cookies.get("auth_next_url")?.value) ??
    "/dashboard";

  const { pathname, search } = req.nextUrl;

  // A direct GET of this internal endpoint — no proxy rewrite happened.
  // The `intended` query parameter (forwarded by the proxy under framework
  // versions that expose the rewritten URL) and the cookie are all there is.
  if (pathname.startsWith("/api/")) {
    return fromCookieChain();
  }

  // A proxied recovery of a real page. This Next build hands the handler the
  // ORIGINAL request URL — there is no rewrite marker on the request — so
  // `pathname` IS the page being recovered: a document navigation, a
  // client-side transition, a `router.refresh()`, or a `<Link>` prefetch. It
  // is the only value describing where the user actually is, and it is what
  // recovery must return them to.
  //
  // The old code answered with `auth_next_url` here instead. That cookie is
  // stale by construction — it is stamped on every protected response and
  // this build strips the RSC/prefetch headers, so a prefetch of a link the
  // user never opened rewrote it. The next background session recovery (a
  // `router.refresh()` kicked off by an `apiFetch` 401) then 307'd the user
  // to that previewed page: the reported "spontaneous" jump.
  const isAuthPage = AUTH_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isAuthPage) {
    return fromCookieChain();
  }

  return sanitizeDestination(`${pathname}${search}`) ?? "/dashboard";
}

/**
 * What Django's answer actually said about a token.
 *
 * - `"valid"` -- Django recognized the token (200).
 * - `"invalid"` -- Django definitively rejected it (401/403).
 * - `"unknown"` -- Django was busy (429) or broken (5xx). This says NOTHING
 *   about the session, and must never be read as a logout signal.
 */
type VerifyResult = "valid" | "invalid" | "unknown";

/**
 * Verify an access token against Django, retrying transient answers.
 *
 * `fetchDjango` already rides out 429/5xx (honoring `Retry-After`), so an
 * `"unknown"` here means the blip outlasted the retries -- Django is still
 * saying "slow down", which is not evidence of a dead session.
 */
async function verify(token: string): Promise<VerifyResult> {
  try {
    const me = await fetchDjango("/apis/auth/users/me/", {
      cookie: `access=${token}`,
    });
    if (me.ok) return "valid";
    if (me.status === 429 || me.status >= 500) return "unknown";
    return "invalid";
  } catch {
    return "unknown";
  }
}

type RefreshOutcome =
  | { ok: true; access?: string; rotated: Array<{ name: string; value: string }> }
  | { ok: false; status: number };

/**
 * In-process refresh de-duplication.
 *
 * A single page load rewrites to this handler several times (document + RSC
 * + a second tab), each carrying the SAME `refresh` cookie. Django rotates
 * and blacklists refresh tokens, so without this every duplicate POST would
 * replay a token the first POST just blacklisted and come back
 * `401 token_blacklisted` -- which reads as "session dead". The Django side
 * single-flights the same race across its 4 uvicorn workers via Redis
 * (see `core/single_flight.py`); this map covers this Next process.
 *
 * Settled results are held briefly (not deleted immediately) so a late
 * arrival still holding the pre-rotation cookie gets the same rotated
 * tokens instead of a 401.
 */
const inFlightRefreshes = new Map<string, Promise<RefreshOutcome>>();
const REFRESH_RESULT_TTL_MS = 10_000;

function refreshOnce(refresh: string): Promise<RefreshOutcome> {
  const existing = inFlightRefreshes.get(refresh);
  if (existing) return existing;

  const promise = (async (): Promise<RefreshOutcome> => {
    try {
      const rf = await fetch(`${BACKEND_URL}/apis/auth/jwt/refresh/`, {
        method: "POST",
        headers: {
          Cookie: `refresh=${refresh}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!rf.ok) {
        return { ok: false, status: rf.status };
      }

      // Token from the JSON body (normal SimpleJWT refresh), or from the
      // rotated Set-Cookie headers when Django answers 204 (bodyless).
      const data = (await rf.json().catch(() => null)) as {
        access?: string;
      } | null;
      let newAccess = data?.access;
      const rotated: Array<{ name: string; value: string }> = [];
      if (!newAccess) {
        for (const raw of rf.headers.getSetCookie()) {
          const [pair] = raw.split("; ");
          const eq = pair.indexOf("=");
          if (eq <= 0) continue;
          const name = pair.slice(0, eq);
          if (name !== "access" && name !== "refresh") continue;
          const value = pair.slice(eq + 1);
          if (name === "access") newAccess = value;
          rotated.push({ name, value });
        }
      }

      return { ok: true, access: newAccess, rotated };
    } catch {
      return { ok: false, status: 0 };
    }
  })();

  inFlightRefreshes.set(refresh, promise);
  void promise.then(() => {
    const timer = setTimeout(
      () => inFlightRefreshes.delete(refresh),
      REFRESH_RESULT_TTL_MS,
    );
    // Do not keep the event loop alive just for cleanup.
    (timer as unknown as { unref?: () => void }).unref?.();
  });

  return promise;
}

/**
 * Definitive "session is dead": Django rejected both the access and the
 * refresh token. THIS is the only path that clears cookies -- a 429/5xx
 * never reaches it.
 */
function deadSessionResponse(): ReturnType<typeof redirectTo> {
  const res = redirectTo("/login");
  res.cookies.delete("access");
  res.cookies.delete("refresh");
  res.cookies.delete("auth_next_url");
  return res;
}

/**
 * GET /api/auth/check
 *
 * Loop-breaker + session validator. The proxy cannot call Django (edge
 * middleware, no backend env), so it derives intent from cookie *presence*.
 * That is safe for gating unauthenticated users, but dangerous in reverse:
 * a stale/blacklisted/expired `access` cookie makes the proxy think the user
 * is signed in and bounce them toward /dashboard, which fails, redirects back
 * to /login, and loops forever.
 *
 * This Route Handler runs on Node where the backend env is available, so it:
 *   1. Verifies the access token against Django, silently refreshing if 401.
 *   2. Valid → 307 back to the path the request came in on (see
 *      `destinationFor`), falling back to `auth_next_url` or /dashboard.
 *   3. Invalid → clears the stale cookies and 307 to /login.
 *
 * Because it clears cookies on death, the next proxy pass sees a genuinely
 * logged-out user and lets /login render — the loop terminates.
 *
 * ## This endpoint is internal, and the browser never sees it
 *
 * The proxy reaches this handler through `NextResponse.rewrite`, not a
 * redirect, so this path is not a user-facing URL and should not be linked
 * to, bookmarked, or treated as part of the app's surface. It is not Django's
 * API either: Django is mounted at `/apis/` (see nginx/server.conf), while
 * `/api/*` is this Next.js BFF layer that fronts Django server-side.
 *
 * Every `Location` below is a relative path (see `redirectTo`), so the browser
 * resolves it against app.vistasolve.net and can never be bounced to
 * localhost:3000 by a loopback `req.url`.
 *
 * ## What counts as a dead session
 *
 * ONLY a definitive Django rejection of both tokens (401/403 on the access
 * token AND on the refresh). A 429 ("slow down") or 5xx ("Django is broken")
 * is not evidence of anything: an active user whose request bucket drained
 * must be sent on to the destination page, where the guarded render retries
 * and decides. Clearing cookies on a throttle blip is exactly the bug this
 * handler exists to fix.
 */
export async function GET(req: NextRequest) {
  const access = req.cookies.get("access")?.value;
  const refresh = req.cookies.get("refresh")?.value;
  const destination = destinationFor(req);

  // Send the user on to the destination, installing any freshly rotated
  // cookies on the way out.
  const onward = (rotated: Array<{ name: string; value: string }> = []) =>
    buildOnward(destination, rotated);

  // 1. Access token present → verify it against Django.
  if (access) {
    const verdict = await verify(access);

    if (verdict === "valid") {
      return onward();
    }

    // "unknown" means throttled/broken, not rejected. The proxy already
    // validated the token's exp client-side, so treat it as usable and let
    // the destination page (which retries transient answers) make the final
    // call. Destroying the session here would be the bug.
    if (verdict === "unknown") {
      return onward();
    }

    // "invalid": fall through to the refresh attempt below.
  }

  // 2. Access missing or invalid → try to refresh with the refresh cookie.
  if (refresh) {
    const outcome = await refreshOnce(refresh);

    if (outcome.ok) {
      if (outcome.access) {
        // Re-validate the FRESH token before trusting the session. This
        // breaks the loop for blacklisted/banned accounts whose refresh
        // token is still technically valid: they get logged out instead of
        // ping-ponging between /dashboard and /login forever.
        const verdict = await verify(outcome.access);

        // "unknown" (throttled re-verify) is not "invalid": the 204 refresh
        // already proved the session is alive, so install the fresh cookies
        // and continue.
        if (verdict !== "invalid") {
          return onward(outcome.rotated);
        }

        return deadSessionResponse();
      }

      // Refreshed successfully but no parsable access cookie (logout
      // blacklist edge): don't destroy anything -- the destination page
      // re-checks with the old cookie and decides.
      return onward();
    }

    // Refresh failed. A definitive rejection (401/403/400) means the token
    // is dead/blacklisted: clear the cookies so the loop terminates.
    if (outcome.status !== 429 && outcome.status < 500 && outcome.status !== 0) {
      return deadSessionResponse();
    }

    // Transient failure (throttled or Django down): the session may still
    // be perfectly valid. Never clear cookies. If we still hold an access
    // cookie, send the user on (the page re-verifies); otherwise the login
    // page is the honest destination.
    if (access) {
      return onward();
    }
    return redirectTo("/login");
  }

  // 3. No usable tokens at all → dead session.
  return deadSessionResponse();
}

/**
 * 307 to the already-sanitized same-origin destination and install any rotated
 * auth cookies. The destination's own server guard validates workspace access.
 */
function buildOnward(
  destination: string,
  rotated: Array<{ name: string; value: string }>,
) {
  const res = redirectTo(destination);
  res.cookies.delete("auth_next_url");
  for (const { name, value } of rotated) {
    res.cookies.set(name, value, authCookieOptions());
  }
  return res;
}
