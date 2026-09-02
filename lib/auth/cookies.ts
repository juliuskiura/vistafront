import { cookies } from "next/headers";

/**
 * Read the HttpOnly `access` JWT from the request cookies.
 *
 * Server-only: uses `next/headers` `cookies()`, which is a request-time API
 * and can only be called in Server Components, Server Actions, or Route
 * Handlers. The client never has access to this value.
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("access")?.value ?? null;
}

/**
 * Read the HttpOnly `refresh` JWT from the request cookies.
 *
 * Server-only. Used by Server Actions to rotate tokens on the backend.
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("refresh")?.value ?? null;
}

/**
 * Clear authentication cookies on logout.
 *
 * Server-only. The `.delete` method requires a Server Function or Route
 * Handler — call this from a Server Action (e.g. `logoutAction`), never from
 * a Server Component during render.
 */
export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("access");
  cookieStore.delete("refresh");
}
