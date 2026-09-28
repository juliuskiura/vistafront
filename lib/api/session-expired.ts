/**
 * The session-expiry contract shared by the two halves of the fix.
 *
 * ## Why this file exists
 *
 * A Route Handler that fronts Django for a Client Component must be able to
 * say "your access token died, go re-establish the session" without guessing.
 * It cannot redirect, because the caller is a `fetch()` that wants JSON, not a
 * browser that wants a page. So it answers `401` and stamps one extra header
 * on the way out; the client wrapper (`lib/api/client-fetch.ts`) looks for
 * that header and calls `router.refresh()`.
 *
 * ## Why it has no imports
 *
 * `lib/api/route-errors.ts` (server) imports `next/server` and must never end
 * up in a browser bundle. Client Components import this module instead. It has
 * to stay import-free so both sides can share it without dragging Next's
 * server runtime along.
 *
 * See "JWT refresh happens in exactly one place" in `AGENTS.md` for why the
 * refresh itself is a *page* concern and cannot happen here.
 */

/** Marks a `401` as "expired JWT" rather than "not authenticated at all". */
export const SESSION_EXPIRED_HEADER = "X-Session-Expired";

/** Header value. Kept trivial so the check is an exact match, not `""`-ish. */
export const SESSION_EXPIRED_VALUE = "1";

/**
 * Thrown by `apiFetch` so callers can tell a recoverable expiry apart from a
 * real failure. TanStack Query `queryFn`s should let this bubble: the default
 * `retry` backoff (1s → 2s → 4s) gives the in-flight `router.refresh()` time
 * to land fresh cookies, and the retry then succeeds.
 */
export class SessionExpiredError extends Error {
  constructor(message = "Your session expired. Reconnecting…") {
    super(message);
    this.name = "SessionExpiredError";
  }
}

/**
 * True only for the deliberate `401 + X-Session-Expired` pair. A bare 401 (a
 * route that forgot the header, or a genuine unauthenticated call) is NOT
 * treated as recoverable — refreshing would not help.
 */
export function isSessionExpiredResponse(response: Response): boolean {
  return (
    response.status === 401 &&
    response.headers.get(SESSION_EXPIRED_HEADER) === SESSION_EXPIRED_VALUE
  );
}
