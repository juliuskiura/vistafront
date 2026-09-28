import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { ServerFetchError } from "./server-fetch-types";
import {
  SESSION_EXPIRED_HEADER,
  SESSION_EXPIRED_VALUE,
} from "./session-expired";

/**
 * Route Handler error mapping.
 *
 * Every `app/api/.../route.ts` runs a `serverFetch`/`serverMutate` on behalf of
 * a Client Component. Since the refresh-on-401 path was removed from
 * `serverFetch` (see "JWT refresh happens in exactly one place" in
 * `AGENTS.md`), a 401 now surfaces here as a thrown `ServerFetchError`. A
 * handler that swallows it into a generic `500` or a bare `200 []` is what
 * leaves a long-lived tab showing empty data forever.
 *
 * These helpers turn that throw into a response the client can act on:
 *
 *   - `401` + `X-Session-Expired` → the client calls `router.refresh()`, which
 *     is a *page* request and therefore does go through the proxy's
 *     `/api/auth/check` hop.
 *   - anything else → the handler's original status, or `502` for a transport
 *     failure, which is the honest answer ("Django was unreachable").
 */

/** True when the thrown error is a 401 from Django. */
function isUnauthorized(error: unknown): error is ServerFetchError {
  return error instanceof ServerFetchError && error.status === 401;
}

/**
 * Did this request actually carry a session?
 *
 * Django answers `401` for both "your token expired" and "you never sent one",
 * and only the first is worth recovering from — a signed-out visitor needs to
 * go to `/login`, not to have the page re-rendered at them. The `access` cookie
 * is `httpOnly` and scoped to `/`, so its mere presence is the signal.
 *
 * `cookies()` is readable in a Route Handler (it is only sealed during a Server
 * Component render), so this is the one place that can make the distinction.
 */
async function hadAccessCookie(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    return Boolean(cookieStore.get("access")?.value);
  } catch {
    return false;
  }
}

/**
 * True when these errors mean "the session died mid-tab" rather than "there was
 * no session".
 *
 * Takes every error from a handler's fallback chain, so a route that tries a
 * public endpoint when the private one fails can still report the expiry:
 *
 * ```ts
 * if (await isRecoverableSessionExpiry(error, fallbackError)) { … }
 * ```
 */
export async function isRecoverableSessionExpiry(
  ...errors: unknown[]
): Promise<boolean> {
  if (!errors.some(isUnauthorized)) return false;
  return hadAccessCookie();
}

/**
 * The recoverable-expiry response.
 *
 * `body` is caller-supplied because several livechat endpoints deliberately
 * degrade to an empty payload (`[]`, `null`) when they cannot reach Django —
 * they must still hand back that shape so the client's `json()` never throws,
 * just with a `401` status and the expiry header attached.
 */
export function sessionExpiredResponse<T>(body: T): NextResponse<T> {
  return NextResponse.json(body, {
    status: 401,
    headers: {
      [SESSION_EXPIRED_HEADER]: SESSION_EXPIRED_VALUE,
      "Cache-Control": "private, no-store",
    },
  });
}

export interface ApiErrorOptions {
  /** Message used for a non-`ServerFetchError` throw. */
  message?: string;
  /** Status for a non-`ServerFetchError` throw. Defaults to `502`. */
  status?: number;
}

/**
 * Map a thrown error to the JSON response the caller should get.
 *
 * A recoverable 401 becomes the expiry response. A 401 with no session behind
 * it is passed through as a plain `401` so the client does not attempt a
 * pointless refresh. Any other `ServerFetchError` keeps its own status
 * (403/404/422 from Django are meaningful to the UI). A non-`ServerFetchError`
 * is a bug or a transport failure, so it becomes `502` with the handler's
 * `message` — never the raw stack.
 */
export async function apiErrorResponse(
  error: unknown,
  options: ApiErrorOptions = {},
): Promise<NextResponse> {
  if (await isRecoverableSessionExpiry(error)) {
    return sessionExpiredResponse({ error: "Session expired." });
  }

  if (error instanceof ServerFetchError) {
    return NextResponse.json(
      { detail: error.body || error.message },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error:
        options.message ??
        (error instanceof Error ? error.message : "Server fetch failed"),
    },
    { status: options.status ?? 502 },
  );
}
