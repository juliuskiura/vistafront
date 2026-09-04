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
 * Reads the HttpOnly 'access' cookie and validates with Django backend.
 * Returns null if not authenticated or token is invalid.
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

    if (!response.ok) {
      return null;
    }

    return await response.json();
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

    const data = (await response.json()) as { access?: string };
    if (!data.access) {
      return false;
    }

    const cookieStore = await cookies();
    cookieStore.set("access", data.access, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return true;
  } catch (error) {
    console.error("Failed to refresh token:", error);
    return false;
  }
}

/**
 * Clear authentication cookies on logout.
 *
 * Re-exported from `lib/auth/cookies.ts` so callers that already depend on
 * `lib/auth/server.ts` do not need a second import. Server-only.
 */
export const clearAuthCookies = clearAuthCookiesFromStore;
