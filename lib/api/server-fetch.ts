"use server";

import { cookies } from "next/headers";
import { ServerFetchError, type RequestOptions, type MutateOptions } from "./server-fetch-types";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

async function tryRefreshAccessToken(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): Promise<boolean> {
  const refreshToken = cookieStore.get("refresh")?.value;
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BACKEND_URL}/apis/auth/jwt/refresh/`, {
      method: "POST",
      headers: {
        Cookie: `refresh=${refreshToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) return false;

    const data = (await response.json()) as { access?: string };
    if (!data.access) return false;

    cookieStore.set("access", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Forward a rotated refresh cookie (ROTATE_REFRESH_TOKENS) so the browser
    // keeps a valid refresh token for the next refresh.
    forwardRotatedRefreshCookie(response, cookieStore);

    return true;
  } catch {
    return false;
  }
}

/**
 * Forward a rotated `refresh` cookie from Django's `Set-Cookie` headers onto
 * the outbound browser cookies. If the response does not include one (token
 * rotation disabled), the existing cookie is left untouched.
 */
function forwardRotatedRefreshCookie(
  response: Response,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): void {
  const setCookies = response.headers.getSetCookie();
  if (!setCookies.length) return;

  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split("; ");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    if (name !== "refresh") continue;

    const lowerAttrs = attributes.map((a) => a.toLowerCase());
    const secure = lowerAttrs.some((a) => a === "secure");
    const sameSiteAttr = attributes.find((a) =>
      a.toLowerCase().startsWith("samesite="),
    )?.split("=")[1];
    const sameSite = (sameSiteAttr ?? "lax").toLowerCase() as
      | "lax"
      | "strict"
      | "none";

    cookieStore.set("refresh", value, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
    });
    return;
  }
}

/**
 * Server-side fetch utility that forwards auth cookies to Django backend.
 * Use this in Server Components and Server Actions to fetch authenticated data.
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
    const isAuthError = response.status === 401 || response.status === 403;
    const canRetry = !options._retry && isAuthError && !!refreshToken;

    if (canRetry) {
      const refreshed = await tryRefreshAccessToken(cookieStore);
      if (refreshed) {
        return serverFetch<T>(path, { ...options, _retry: true });
      }
    }

    const errorText = await response.text();
    throw new ServerFetchError(response.status, errorText, path);
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
    const isAuthError = response.status === 401 || response.status === 403;
    const canRetry = !options._retry && isAuthError && !!refreshToken;

    if (canRetry) {
      const refreshed = await tryRefreshAccessToken(cookieStore);
      if (refreshed) {
        return serverMutate<T>(path, { ...options, _retry: true });
      }
    }

    const errorText = await response.text();
    throw new ServerFetchError(response.status, errorText, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
