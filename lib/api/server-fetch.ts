"use server";

import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import {
  ServerFetchError,
  ServerUnavailableError,
  type RequestOptions,
  type MutateOptions,
} from "./server-fetch-types";
import { fetchRetrying } from "./django-fetch";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const WORKSPACE_LIST_PATH = "/apis/workspaces/workspaces/";
const WORKSPACE_LIST_CACHE_TTL_MS = 15_000;
const WORKSPACE_LIST_STALE_TTL_MS = 60_000;
const WORKSPACE_LIST_RETRY_COOLDOWN_MS = 5_000;
const WORKSPACE_LIST_CACHE_MAX_ENTRIES = 1_000;

type WorkspaceListCacheEntry = {
  expiresAt: number;
  staleUntil: number;
  value: unknown;
};

const workspaceListCache = new Map<string, WorkspaceListCacheEntry>();
const workspaceListRequests = new Map<string, Promise<unknown>>();
let workspaceListCacheVersion = 0;

function invalidateWorkspaceListCache(): void {
  workspaceListCacheVersion += 1;
  workspaceListCache.clear();
  workspaceListRequests.clear();
}

function changesWorkspaceMembership(path: string): boolean {
  return (
    path === WORKSPACE_LIST_PATH ||
    /^\/apis\/workspaces\/workspaces\/[^/]+\/(?:leave\/)?$/.test(path) ||
    path === "/apis/workspaces/invitations/redeem/"
  );
}

function isTransientWorkspaceFailure(error: unknown): boolean {
  return (
    error instanceof ServerUnavailableError ||
    (error instanceof ServerFetchError &&
      (error.status === 429 || error.status >= 500))
  );
}

async function getWorkspaceList<T>(
  accessToken: string,
  load: () => Promise<T>,
): Promise<T> {
  const key = createHash("sha256").update(accessToken).digest("hex");
  const cached = workspaceListCache.get(key);
  const now = Date.now();
  if (cached?.staleUntil !== undefined && cached.staleUntil <= now) {
    workspaceListCache.delete(key);
  } else if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }
  const stale = cached && cached.staleUntil > now ? cached : undefined;

  const existing = workspaceListRequests.get(key);
  if (existing) return existing as Promise<T>;

  const version = workspaceListCacheVersion;
  const request = load()
    .then((value) => {
      if (version === workspaceListCacheVersion) {
        const now = Date.now();
        workspaceListCache.delete(key);
        for (const [cachedKey, entry] of workspaceListCache) {
          if (entry.staleUntil <= now) workspaceListCache.delete(cachedKey);
        }
        while (workspaceListCache.size >= WORKSPACE_LIST_CACHE_MAX_ENTRIES) {
          const oldestKey = workspaceListCache.keys().next().value;
          if (oldestKey === undefined) break;
          workspaceListCache.delete(oldestKey);
        }
        workspaceListCache.set(key, {
          expiresAt: now + WORKSPACE_LIST_CACHE_TTL_MS,
          staleUntil: now + WORKSPACE_LIST_STALE_TTL_MS,
          value,
        });
      }
      return value;
    })
    .catch((error: unknown) => {
      if (
        version === workspaceListCacheVersion &&
        stale &&
        stale.staleUntil > Date.now() &&
        isTransientWorkspaceFailure(error)
      ) {
        stale.expiresAt = Math.min(
          stale.staleUntil,
          Date.now() + WORKSPACE_LIST_RETRY_COOLDOWN_MS,
        );
        return stale.value as T;
      }
      throw error;
    })
    .finally(() => {
      if (workspaceListRequests.get(key) === request) {
        workspaceListRequests.delete(key);
      }
    });

  workspaceListRequests.set(key, request);
  return request;
}

/**
 * Server-side fetch utility that forwards auth cookies to Django backend.
 * Use this in Server Components and Server Actions to fetch authenticated data.
 *
 * ## Why this never refreshes the JWT
 *
 * A 401 here is terminal: the caller sees a `ServerFetchError(401)` and the
 * auth guard (`requireAuth()`) sends the user to `/login`. Refreshing from
 * inside this function used to be attempted and was wrong twice over.
 *
 * 1. **It cannot work from a Server Component.** Next seals `cookies()` for
 *    the whole render phase — pages get `phase: 'render'`, Route Handlers and
 *    Server Actions get `phase: 'action'` — and `cookies().set()` throws
 *    `ReadonlyRequestCookiesError` (E1180) unless the phase is `'action'`
 *    (`next/dist/server/web/spec-extension/adapters/request-cookies.js`).
 *    Every attempt to write the refreshed token from a page render threw, got
 *    swallowed by a `catch`, and was reported as "refresh failed" anyway.
 *
 * 2. **Where it *could* run, it raced itself.** Django runs with
 *    `ROTATE_REFRESH_TOKENS = True` and `BLACKLIST_AFTER_ROTATION = True`
 *    (`regwakes/settings.py`). Every in-flight request carries the same old
 *    `refresh` cookie, so the first one to POST `/apis/auth/jwt/refresh/`
 *    rotates it and blacklists the old copy — and every concurrent refresh
 *    with that same cookie then fails `token_blacklisted`. A page render
 *    fires five such calls in parallel (`app/(app)/[workspace]/layout.tsx`),
 *    so the losers read their 401 as "the session is dead" and logged the
 *    user out.
 *
 * Refreshing is therefore a **single, serialized hop in the proxy**
 * (`proxy.ts` → `GET /api/auth/check`, a Route Handler where cookies *are*
 * mutable). By the time any page or handler renders, the browser already
 * holds a fresh `access` cookie.
 *
 * ## Why every call retries 429s
 *
 * Django's per-user throttle bucket is shared across all endpoints, and a
 * single page render fires ~6 authenticated calls at it. A drained bucket
 * answers `429` with a `Retry-After` of a second or two -- a blip, not a
 * verdict. Callers used to turn that blip into `ServerFetchError(429)` and
 * then into a redirect (to `/login`, to `/onboarding`, to an empty list),
 * so one busy second could bounce an active user out of the app. The retry
 * lives here, at the base, because every `lib/api/*` wrapper inherits it:
 * one well-aimed retry absorbs the blip for all of them. 502/503/504 are
 * retried too (never reached Django); a 500 is not (the handler may have
 * applied a mutation).
 */
export async function serverFetch<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access");
  const refreshToken = cookieStore.get("refresh");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const cookieHeader = [
    accessToken ? `access=${accessToken.value}` : null,
    refreshToken ? `refresh=${refreshToken.value}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (options.workspace) {
    headers["X-Workspace"] = options.workspace;
  }

  const load = async (): Promise<T> => {
    const response = await fetchRetrying(`${BACKEND_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: options.cache ?? "no-store",
      next: options.next,
    });

    if (!response.ok) {
      throw new ServerFetchError(response.status, await response.text(), path);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  };

  if (path === WORKSPACE_LIST_PATH && (options.method ?? "GET") === "GET") {
    const accessValue = accessToken?.value;
    if (accessValue) return getWorkspaceList(accessValue, load);
  }

  return load();
}

/**
 * Server-side fetch for mutations (POST, PUT, PATCH, DELETE).
 * Automatically includes CSRF token for Django and the ``X-Workspace``
 * tenant header. See {@link RequestOptions.workspace} for why the header
 * is mandatory.
 *
 * 401s are terminal here too — see the note on {@link serverFetch}.
 */
export async function serverMutate<T>(
  path: string,
  options: MutateOptions,
): Promise<T> {
  const method = options.method ?? "POST";
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access");
  const refreshToken = cookieStore.get("refresh");
  const csrfToken = cookieStore.get("csrftoken");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  const cookieHeader = [
    accessToken ? `access=${accessToken.value}` : null,
    refreshToken ? `refresh=${refreshToken.value}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken.value;
  }

  if (options.workspace) {
    headers["X-Workspace"] = options.workspace;
  }

  const response = await fetchRetrying(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    // Some endpoints carry a business verdict in an error status (e.g. verify
    // answers 400 with the verdict). Those callers opt the status in explicitly
    // and get the parsed body back; everything else throws as before.
    if (options.acceptStatuses?.includes(response.status)) {
      return (await response.json()) as T;
    }
    throw new ServerFetchError(response.status, await response.text(), path);
  }

  if (changesWorkspaceMembership(path)) {
    invalidateWorkspaceListCache();
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
