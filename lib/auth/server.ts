"use server";

import { cache } from "react";
import { redirect } from "next/navigation";
import { listWorkspaces, type Workspace } from "@/lib/api";
import {
  clearAuthCookies as clearAuthCookiesFromStore,
  getAccessToken,
} from "@/lib/auth/cookies";
import { fetchDjango } from "@/lib/api/django-fetch";
import {
  asTransientFailure,
  ServerUnavailableError,
} from "@/lib/api/server-fetch-types";

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

/**
 * Fetch the current user's workspaces once per server request.
 *
 * `requireWorkspace` is called from the `[workspace]/layout.tsx` guard and
 * from every nested layout/page. Wrapping in React `cache()` collapses all
 * calls in a request into a single backend fetch, so a full-tree
 * revalidation costs one `GET /apis/workspaces/workspaces/` instead of one
 * per layout.
 */
const getWorkspacesForUser = cache(
  async (): Promise<Workspace[]> => listWorkspaces(),
);

/**
 * Get the current authenticated user from the server.
 * Reads the HttpOnly 'access' cookie and validates it against Django.
 *
 * Returns null ONLY for a definitive "no session" answer: no `access`
 * cookie, or Django rejecting the token (401/403). It deliberately does
 * **not** try to refresh: see the long note on `serverFetch` in
 * `lib/api/server-fetch.ts` for why a refresh inside a page render cannot
 * work (Next seals `cookies()` outside the action phase) and why attempting
 * one from several places at once races Django's refresh-token rotation.
 * The proxy's `GET /api/auth/check` hop owns refresh.
 *
 * ## Why 429 and 5xx are special
 *
 * Django's rate limiter answers `429 Too Many Requests` when the per-user
 * bucket (shared across every endpoint) drains under the app's normal
 * fan-out. That sentence means "slow down", NOT "you are not logged in" --
 * the token may be perfectly valid. Reading a 429 as "no user" here is
 * what used to `redirect("/login")` an active user out of their session.
 * Transient answers are therefore retried (`Retry-After` honored), and if
 * they persist this throws {@link ServerUnavailableError} so a retry
 * boundary can render instead of the cookies being doubted.
 */
export const getAuthUser = cache(async (): Promise<User | null> => {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return null;
  }

  const response = await fetchDjango("/apis/auth/users/me/", {
    cookie: `access=${accessToken}`,
  });

  // Definitive "no session": Django rejected the token itself.
  if (response.status === 401 || response.status === 403) {
    return null;
  }

  if (response.ok) {
    return (await response.json()) as User;
  }

  // A 429/5xx that survived every retry. Not a logout signal.
  throw new ServerUnavailableError(response.status, "/apis/auth/users/me/");
});

/**
 * Require authentication. Redirects to /login if not authenticated.
 * Use in Server Components that need auth protection.
 *
 * Only a definitive "no session" (`getAuthUser()` → null) redirects. A
 * transient Django outage/rate-limit throws {@link ServerUnavailableError}
 * instead -- bouncing to /login there would clear a valid session.
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
export async function requireWorkspace(
  slug: string,
  preloadedWorkspaces?: Workspace[],
): Promise<WorkspaceItem> {
  const user = await requireAuth();
  const normalized = (slug || "").toLowerCase();

  if (!normalized) {
    redirect("/onboarding");
  }

  let workspaces: Workspace[];
  try {
    workspaces = preloadedWorkspaces ?? (await getWorkspacesForUser());
  } catch (error) {
    // A throttled/broken Django is NOT "this user has no workspaces".
    // Redirecting to /onboarding on a 429 sent active, fully-provisioned
    // users to the "create a business" page for no reason. Surface it to
    // the retry boundary instead.
    const failure = asTransientFailure(error);
    if (failure !== error) throw failure;
    console.error("Failed to load workspaces for requireWorkspace:", error);
    redirect("/onboarding");
  }

  const match = workspaces.find(
    (ws) => ws.domain.toLowerCase() === normalized,
  );

  if (!match) {
    // A user with no workspace membership at all has nothing to be
    // "restricted" to — send them to onboarding to create or join a
    // workspace instead of the workspace-access page.
    if (workspaces.length === 0) {
      redirect("/onboarding");
    }

    // Check if the user has a redirect_url pointing to a workspace they belong to
    // (from their last_workspace profile attribute).
    // If so, redirect there instead of showing /restricted.
    if (user.redirect_url) {
      const redirectMatch = workspaces.find(
        (ws) => user.redirect_url && ws.url === user.redirect_url,
      );
      if (redirectMatch) {
        redirect(redirectMatch.url);
      }
      // Also try matching by domain in the redirect_url
      const redirectDomain = user.redirect_url.split("/")[1]?.toLowerCase();
      if (redirectDomain) {
        const domainMatch = workspaces.find(
          (ws) => ws.domain.toLowerCase() === redirectDomain,
        );
        if (domainMatch) {
          redirect(domainMatch.url);
        }
      }
    }
    redirect("/restricted");
  }

  void user;
  return match;
}

/**
 * Clear authentication cookies on logout.
 *
 * Re-exported from `lib/auth/cookies.ts` so callers that already depend on
 * `lib/auth/server.ts` do not need a second import. Server-only.
 */
export const clearAuthCookies = clearAuthCookiesFromStore;
