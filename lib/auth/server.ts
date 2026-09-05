import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { listWorkspaces, type Workspace } from "@/lib/api";
import {
  clearAuthCookies as clearAuthCookiesFromStore,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/cookies";

export interface User {
  id: number;
  nanoid: string;
  email: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  signup_date: string;
  is_active: boolean;
  is_superuser: boolean;
  is_admin: boolean;
  is_banned: boolean;
  agree_terms: boolean;
  redirect_url?: string;
}

/**
 * @deprecated import `Workspace` from `@/lib/api` instead.
 */
export type WorkspaceItem = Workspace;

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Get the current authenticated user from the server.
 * Reads the HttpOnly 'access' cookie and validates with Django backend,
 * refreshing the access token once via `refreshAccessToken()` on a 401.
 * Returns null if not authenticated or the token cannot be refreshed.
 */
export async function getAuthUser(): Promise<User | null> {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_URL}/apis/auth/users/me/`, {
      headers: {
        Cookie: `access=${accessToken}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (response.ok) {
      return await response.json();
    }

    // Access token expired or invalid — try to refresh once before giving up.
    if (response.status === 401 || response.status === 403) {
      const refreshed = await refreshAccessToken();
      if (!refreshed) {
        return null;
      }

      const newAccessToken = await getAccessToken();
      if (!newAccessToken) {
        return null;
      }

      const retry = await fetch(`${BACKEND_URL}/apis/auth/users/me/`, {
        headers: {
          Cookie: `access=${newAccessToken}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!retry.ok) {
        return null;
      }

      return await retry.json();
    }

    return null;
  } catch (error) {
    console.error("Failed to fetch auth user:", error);
    return null;
  }
}

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Use in Server Components that need auth protection.
 */
export async function requireAuth(): Promise<User> {
  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

/**
 * Require a valid workspace from the URL slug.
 *
 * Reads the `workspace` dynamic segment, calls the backend to confirm the
 * signed-in user belongs to that workspace, and returns the matching
 * `WorkspaceItem`. Redirects to `/restricted` if the slug does not match any
 * workspace the user belongs to, or to `/login` if the user is not signed in.
 *
 * Use this in the `[workspace]` segment's `layout.tsx` to enforce
 * tenant membership on the server before any child route renders.
 */
export async function requireWorkspace(slug: string): Promise<WorkspaceItem> {
  const user = await requireAuth();
  const normalized = (slug || "").toLowerCase();

  if (!normalized) {
    redirect("/onboarding");
  }

  let workspaces: Workspace[];
  try {
    workspaces = await listWorkspaces();
  } catch (error) {
    console.error("Failed to load workspaces for requireWorkspace:", error);
    redirect("/restricted");
  }

  const match = workspaces.find(
    (ws) => ws.domain.toLowerCase() === normalized,
  );

  if (!match) {
    redirect("/restricted");
  }

  void user;
  return match;
}

/**
 * Refresh the access token using the refresh token cookie.
 * Called when the access token is expired.
 */
export async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return false;
  }

  const cookieStore = await cookies();

  try {
    const response = await fetch(`${BACKEND_URL}/apis/auth/jwt/refresh/`, {
      method: "POST",
      headers: {
        Cookie: `refresh=${refreshToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    if (response.status === 204) {
      forwardAuthCookies(response, cookieStore);
      return true;
    }

    const data = (await response.json()) as { access?: string };
    if (!data.access) {
      return false;
    }

    cookieStore.set("access", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    forwardAuthCookies(response, cookieStore);

    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return false;
  }
}

/**
 * Forward rotated auth cookies (`access`, `refresh`) from Django's
 * `Set-Cookie` headers onto the outbound browser cookies. If the response
 * does not include a given cookie (token rotation disabled), the existing
 * cookie is left untouched.
 */
function forwardAuthCookies(
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
    if (name !== "access" && name !== "refresh") continue;

    const lowerAttrs = attributes.map((a) => a.toLowerCase());
    const secure = lowerAttrs.some((a) => a === "secure");
    const sameSiteAttr = attributes.find((a) =>
      a.toLowerCase().startsWith("samesite="),
    )?.split("=")[1];
    const sameSite = (sameSiteAttr ?? "lax").toLowerCase() as
      | "lax"
      | "strict"
      | "none";

    cookieStore.set(name, value, {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
    });
  }
}

/**
 * Clear authentication cookies on logout.
 *
 * Re-exported from `lib/auth/cookies.ts` so callers that already depend on
 * `lib/auth/server.ts` do not need a second import. Server-only.
 */
export const clearAuthCookies = clearAuthCookiesFromStore;
