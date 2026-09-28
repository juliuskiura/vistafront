import {
  isSessionExpiredResponse,
  SessionExpiredError,
} from "./session-expired";

/**
 * `fetch` for Client Components, with session-expiry recovery wired in.
 *
 * ## The problem
 *
 * Client Components cannot call `serverFetch` (it is `"use server"`), so they
 * go through a Next Route Handler. Django's access token lives 60 minutes, but
 * a tab left open longer than that has a dead `access` cookie. `serverFetch`
 * deliberately treats that 401 as terminal and never refreshes — the refresh is
 * a *page* concern handled by the `proxy.ts` → `/api/auth/check` hop.
 *
 * A `fetch("/api/…")` is not a page request, so it never gets that hop. Before
 * this wrapper, that 401 became a `502` or a silent empty list, and the UI just
 * stayed blank until the user manually reloaded.
 *
 * ## The fix
 *
 * A Route Handler marks its 401 with `X-Session-Expired` (see
 * `lib/api/route-errors.ts`). This wrapper detects that, calls `recover()` —
 * which is `router.refresh()` — and throws `SessionExpiredError`. `refresh()`
 * issues a real page request, so the proxy *does* route it through
 * `/api/auth/check`, the cookies come back fresh, and the caller's next attempt
 * (a TanStack Query retry, or the user's next click) succeeds.
 */

/** Injected by the caller so this module needs no router and no globals. */
export type SessionRecovery = () => void;

/**
 * The shape `useApiFetch()` hands back: `fetch` with session recovery
 * pre-bound, so call sites only deal with `input` and `init`.
 */
export type ApiFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

const NOOP_RECOVERY: SessionRecovery = () => {};

/**
 * Drop-in `fetch` replacement.
 *
 * @param input   Same as `fetch`.
 * @param init    Same as `fetch`. `credentials: "include"` is the default since
 *                every Route Handler in this app is same-origin and
 *                cookie-authenticated.
 * @param recover Called once when the server reports an expired session.
 *                Defaults to a no-op so a component outside
 *                `SessionRefreshProvider` degrades to a thrown
 *                `SessionExpiredError` rather than crashing.
 * @throws {SessionExpiredError} On `401 + X-Session-Expired`, after `recover()`.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  recover: SessionRecovery = NOOP_RECOVERY,
): Promise<Response> {
  const response = await fetch(input, { credentials: "include", ...init });

  if (isSessionExpiredResponse(response)) {
    recover();
    throw new SessionExpiredError();
  }

  return response;
}
