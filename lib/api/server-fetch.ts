"use server";

import { cookies } from "next/headers";
import { ServerFetchError, type RequestOptions, type MutateOptions } from "./server-fetch-types";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

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

  const response = await fetch(`${BACKEND_URL}${path}`, {
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

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ServerFetchError(response.status, await response.text(), path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
