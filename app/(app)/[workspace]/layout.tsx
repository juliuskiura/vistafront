import {
  listWorkspaces,
  getNavigationSidebar,
  getSubscriptionState,
  listRooms,
} from "@/lib/api";
import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { asTransientFailure } from "@/lib/api/server-fetch-types";

/**
 * A transient Django failure (429 / 5xx / transport) must NEVER be
 * swallowed into a degraded shell.
 *
 * An empty `workspaces` array reads as "this user has no workspace" --
 * `requireWorkspace` then sends an active user to `/onboarding`. An empty
 * sidebar reads as "no features". An empty subscription contract silently
 * unlocks nothing. In every case the app lies to a user whose session is
 * perfectly fine and whose server was merely busy for two seconds.
 *
 * `asTransientFailure` converts 429/5xx/transport failures into
 * `ServerUnavailableError` (preserving the real status) and returns any
 * other error unchanged, so each call site keeps its own fallback for
 * genuine failures.
 */
function rethrowTransient() {
  return (error: unknown) => {
    throw asTransientFailure(error);
  };
}

/** Keep the old degraded default for non-transient failures only. */
const DEFAULT_SUBSCRIPTION_STATE = {
  subscription: null,
  features: [],
  exempt: false,
};

/**
 * Server-side workspace guard + app shell.
 *
 * `requireWorkspace(slug)` runs first; if the signed-in user does not
 * belong to the workspace named by the URL segment, the request is
 * redirected to `/restricted` before any HTML is sent. The shell is then
 * rendered as a Client Component so the sidebar and workspace switcher
 * can react to navigation without a full page reload.
 *
 * The subscription capability contract and the navigation sidebar are
 * fetched in parallel and handed to the shell; the shell exposes the
 * contract to the client tree via `SubscriptionProvider` and every nested
 * page guard shares the one cached fetch (`requireFeature`).
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const user = await requireAuth();
  // No `.catch(() => [])` here on purpose: a throttled listWorkspaces must
  // reach requireWorkspace as an error, not as "zero workspaces" (which
  // would redirect an active user to /onboarding).
  const allWorkspaces = await listWorkspaces().catch(rethrowTransient());
  const active = await requireWorkspace(slug, allWorkspaces);
  const [nav, subscription, rooms] = await Promise.all([
    getNavigationSidebar().catch(rethrowTransient()),
    getSubscriptionState({ workspace: active.nanoid }).catch((error) => {
      const failure = asTransientFailure(error);
      if (failure !== error) throw failure;
      return DEFAULT_SUBSCRIPTION_STATE;
    }),
    user.is_admin
      ? listRooms(active.domain, "all").catch(rethrowTransient())
      : Promise.resolve([]),
  ]);

  return (
    <WorkspaceShell
      workspace={{ nanoid: active.nanoid, name: active.name, domain: active.domain }}
      workspaces={allWorkspaces.map((ws) => ({
        nanoid: ws.nanoid,
        name: ws.name,
        domain: ws.domain,
      }))}
      nav={nav}
      subscription={subscription}
      user={{
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        isAdmin: user.is_admin,
      }}
      hasActiveChat={rooms.some((room) => room.is_active)}
    >
      {children}
    </WorkspaceShell>
  );
}
