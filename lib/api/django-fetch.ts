/**
 * Transient-failure retry for direct Django calls.
 *
 * ## The problem this solves
 *
 * Django rate-limits (`user: 600/minute`, one bucket per user shared across
 * every endpoint). Under the app's normal fan-out -- a page render issues
 * ~6 authenticated calls, several tabs and 30s polling multiply that -- the
 * bucket can drain and Django answers `429 Too Many Requests`.
 *
 * A 429 means "slow down", NOT "your token is invalid". The authentication
 * guard used to read any non-OK response as "no user" and redirected to
 * `/login`, which cascaded into the `/api/auth/check` refresh hop clearing
 * the cookies of a perfectly valid session. This module lets the callers
 * that CANNOT fail -- the session validators -- wait out a transient blip
 * before concluding anything.
 *
 * ## Three sentences Django can say
 *
 * | Status | Meaning | Reaction |
 * |--------|---------|----------|
 * | 2xx / 4xx (non-transient) | definitive answer | return as-is |
 * | 429 | "slow down, your session is fine" | retry with `Retry-After` backoff |
 * | 408 / 502 / 503 / 504 | "never reached Django" | retry |
 * | 500 | "Django ran and broke" | reads retry (not a dead session); mutations do NOT (may have applied) |
 *
 * Server-only: talks to `BACKEND_URL` and forwards httpOnly cookies.
 */

import { ServerUnavailableError } from "./server-fetch-types";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/** Default attempts: one initial try + 2 retries. */
const DEFAULT_ATTEMPTS = 3;

/** Cap for any single wait, including a server-sent `Retry-After`. */
const MAX_DELAY_MS = 5_000;

/** True when the response is transient: Django is busy (429) or broken (5xx). */
export function isTransientStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

/**
 * Statuses that are SAFE to retry, including on mutations.
 *
 * - `429` — the throttle rejected the request before any handler ran, so a
 *   retry cannot double-apply anything.
 * - `408` — the client gave up before Django answered.
 * - `502` / `503` / `504` — nginx/uvicorn answered; the request never
 *   reached Django.
 *
 * A `500` is deliberately excluded: Django ran, so a mutation may have
 * partially succeeded and a blind retry could double-apply it.
 */
const RETRYABLE_STATUSES = new Set([408, 429, 502, 503, 504]);

export function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUSES.has(status);
}

/**
 * How long to wait before the next attempt when there is no response to
 * read a `Retry-After` from (transport failures): 500ms → 1s → 2s …
 * capped at {@link MAX_DELAY_MS}.
 */
function backoffDelayMs(attempt: number): number {
  return Math.min(500 * 2 ** (attempt - 1), MAX_DELAY_MS);
}

/**
 * How long to wait before the next attempt.
 *
 * Honors Django's `Retry-After` header (seconds) when present -- the
 * throttle window is 60s, and the server knows the real wait better than a
 * guessed exponential backoff does. Falls back to {@link backoffDelayMs}.
 */
export function retryDelayMs(response: Response, attempt: number): number {
  const retryAfter = Number(response.headers.get("Retry-After"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Math.min(retryAfter * 1000, MAX_DELAY_MS);
  }
  return backoffDelayMs(attempt);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface FetchRetryingOptions {
  /** Total attempts (initial try included). Default 3. */
  attempts?: number;
  /** Which statuses to retry. Default {@link isRetryableStatus}. */
  shouldRetry?: (status: number) => boolean;
}

/**
 * `fetch` that rides out retryable answers (429 + gateway errors) and
 * transport failures.
 *
 * Shared by every server-side path that talks to Django: `serverFetch` /
 * `serverMutate` (the base used by all `lib/api/*` wrappers) and the
 * auth-guard fetches. The retry predicate is injectable because the
 * session validators may also ride out a plain `500` (a broken Django is
 * not a dead session), while mutations may not (a 500 may have applied).
 *
 * A *thrown* fetch (connection refused, socket reset, DNS, a uvicorn worker
 * cycling under PM2) is retried too -- it has no status code, but it is the
 * same "never reached Django" situation as a 502. If every attempt throws,
 * it is normalized into {@link ServerUnavailableError} (status 0) so
 * callers can classify it without pattern-matching `TypeError` strings.
 *
 * Returns the LAST response -- it never throws for a non-OK status, so the
 * caller still sees the real status.
 */
export async function fetchRetrying(
  url: string,
  init: RequestInit,
  options: FetchRetryingOptions = {},
): Promise<Response> {
  const attempts = Math.max(1, options.attempts ?? DEFAULT_ATTEMPTS);
  const shouldRetry = options.shouldRetry ?? isRetryableStatus;

  let response: Response | undefined;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      response = await fetch(url, init);
    } catch {
      // Transport failure: retry like a 502, then normalize.
      if (attempt < attempts) {
        await sleep(backoffDelayMs(attempt));
        continue;
      }
      throw new ServerUnavailableError(0, url);
    }
    if (!shouldRetry(response.status)) {
      return response;
    }
    if (attempt < attempts) {
      await sleep(retryDelayMs(response, attempt));
    }
  }

  // The loop always assigns at least once (attempts >= 1).
  return response as Response;
}

export interface DjangoFetchOptions {
  /** Cookie header value, e.g. `access=...; refresh=...`. */
  cookie?: string;
  /** Total attempts (initial try included). Default 3. */
  attempts?: number;
}

/**
 * `fetch` against the Django backend that rides out 429/5xx responses.
 *
 * Always returns the LAST response -- it never throws for a non-OK status,
 * so the caller still sees the real status (a 401 after retries is a real
 * 401; a 429 after retries is a real 429 the caller must not misread).
 */
export async function fetchDjango(
  path: string,
  options: DjangoFetchOptions = {},
): Promise<Response> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (options.cookie) {
    headers.Cookie = options.cookie;
  }

  return fetchRetrying(`${BACKEND_URL}${path}`, {
    headers,
    cache: "no-store",
  }, {
    attempts: options.attempts,
    // The session validators treat any 5xx as "unknown, not dead", so they
    // ride out a plain 500 too.
    shouldRetry: isTransientStatus,
  });
}
