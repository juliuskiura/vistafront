import { cookies } from "next/headers";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: RequestCache;
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Serialize a flat object into a URL-encoded query string. Values that are
 * `null` or `undefined` are skipped; arrays are repeated. Safe for simple
 * JSON-encodable values; do not pass nested objects.
 */
export function toQueryString(params: Record<string, unknown> = {}): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        parts.push(
          `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`,
        );
      }
    } else {
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      );
    }
  }
  return parts.length === 0 ? "" : `?${parts.join("&")}`;
}

/**
 * Server-side fetch utility that forwards auth cookies to Django backend.
 * Use this in Server Components and Server Actions to fetch authenticated data.
 */
export async function serverFetch<T>(
  path: string,
  options: RequestOptions = {}
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

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
    next: options.next,
  });

  if (!response.ok) {
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
 * Automatically includes CSRF token for Django.
 */
export async function serverMutate<T>(
  path: string,
  body: unknown,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST"
): Promise<T> {
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

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ServerFetchError(response.status, errorText, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
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
