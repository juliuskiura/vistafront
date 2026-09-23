import {
  listWorkspaces,
  getNavigationSidebar,
  getSubscriptionState,
  listRooms,
} from "@/lib/api";
import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

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
  const allWorkspaces = await listWorkspaces().catch(() => []);
  const active = await requireWorkspace(slug, allWorkspaces);
  const [nav, subscription, rooms] = await Promise.all([
    getNavigationSidebar().catch(() => []),
    getSubscriptionState({ workspace: active.nanoid }).catch(() => ({
      subscription: null,
      features: [],
      exempt: false,
    })),
    user.is_admin ? listRooms(active.domain, "all").catch(() => []) : Promise.resolve([]),
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
