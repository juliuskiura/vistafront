import {
  listWorkspaceMembers,
  listWorkspaces,
  type Workspace,
} from "@/lib/api";
import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { WorkspacesList } from "@/app/(app)/[workspace]/dashboard/workspaces/workspaces-list";
import { WorkspacesTable } from "@/app/(app)/[workspace]/dashboard/workspaces/workspaces-table";

const CONSOLE_ADMIN_DOMAIN = "regwakes";

/**
 * Workspaces settings (Server Component).
 *
 * Lists every workspace the signed-in user belongs to and highlights the
 * active one. Owner/Admin roles get an "Invite members" button that opens
 * a dialog which calls `sendInviteAction`.
 *
 * Console admins (regwakes) operate across every tenant, so they get a
 * TanStack table of *all* workspaces instead of the single-workspace hub.
 */
export default async function WorkspacesSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const user = await requireAuth();

  const [allWorkspaces] = await Promise.all([
    listWorkspaces().catch(() => [] as Workspace[]),
    // Pre-warm the members list so the "Memberships" link is snappy. Errors
    // are non-fatal — the members page has its own fetch.
    listWorkspaceMembers(active.nanoid, active.domain).catch(() => []),
  ]);

  const isConsoleAdmin = user.is_admin && active.domain === CONSOLE_ADMIN_DOMAIN;

  if (isConsoleAdmin) {
    return <WorkspacesTable workspaces={allWorkspaces} />;
  }

  return (
    <WorkspacesList
      active={{
        nanoid: active.nanoid,
        name: active.name,
        domain: active.domain,
        myRole: active.my_role,
      }}
      workspaces={allWorkspaces.map((ws) => ({
        nanoid: ws.nanoid,
        name: ws.name,
        domain: ws.domain,
        myRole: ws.my_role,
      }))}
    />
  );
}
