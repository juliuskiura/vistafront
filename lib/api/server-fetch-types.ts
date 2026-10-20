export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
  workspace?: string;
}

export interface MutateOptions {
  body: unknown;
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  workspace?: string;
  /**
   * HTTP status codes whose response body must be returned as data instead of
   * throwing a {@link ServerFetchError}. Use this for endpoints that encode a
   * business verdict in an error status — e.g. `POST /pages/{id}/verify/`
   * answers `400` with `{ok, error, error_type}`. Never list `401`/`403`
   * (session/CSRF — must stay terminal) or `429`/`5xx` (transient — must keep
   * their throw-and-retry meaning) here.
   */
  acceptStatuses?: readonly number[];
}

export class ServerFetchError extends Error {
  constructor(
    public status: number,
    public body: string,
    public path: string
  ) {
    super(`Server fetch failed: ${status} ${path}`);
    this.name = "ServerFetchError";
  }
}

/**
 * Django answered "slow down" (429) or was broken (5xx) on every retry.
 *
 * This is deliberately NOT a logout signal. Django's rate limiter says
 * nothing about the session -- an active, fully authenticated user hits 429
 * when their request bucket (shared across every endpoint, per user) drains
 * under normal fan-out. Treating this as `null`/401 is what used to clear
 * the cookies and bounce valid users to /login. Callers that gate pages on
 * `getAuthUser()` let this bubble to a retry boundary instead.
 */
export class ServerUnavailableError extends Error {
  constructor(
    public status: number,
    public path: string
  ) {
    super(`Django unavailable (${status}): ${path}`);
    this.name = "ServerUnavailableError";
  }
}

/**
 * Normalize a transient failure into `ServerUnavailableError`, preserving
 * its real status. A non-transient error is returned UNCHANGED (same
 * reference), so callers classify with `result !== error` and keep their
 * own fallback for genuine failures (404, 400, a real bug).
 *
 * Note: a transport failure (`fetch` threw -- connection refused, worker
 * cycling) is already normalized to `ServerUnavailableError(0, …)` by
 * `fetchRetrying`, so status 0 honestly means "never got an HTTP answer".
 */
export function asTransientFailure(error: unknown): unknown {
  if (error instanceof ServerUnavailableError) return error;
  if (
    error instanceof ServerFetchError &&
    (error.status === 429 || error.status >= 500)
  ) {
    return new ServerUnavailableError(error.status, error.path);
  }
  return error;
}

export interface ActionResultLike {
  status?: string;
  message?: string;
}
