import {
  listWorkspaceMembers,
  listWorkspaces,
  type Workspace,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { WorkspacesList } from "@/app/(app)/[workspace]/dashboard/workspaces/workspaces-list";

/**
 * Workspaces settings (Server Component).
 *
 * Lists every workspace the signed-in user belongs to and highlights the
 * active one. Owner/Admin roles get an "Invite members" button that opens
 * a dialog which calls `sendInviteAction`.
 */
export default async function WorkspacesSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const [allWorkspaces] = await Promise.all([
    listWorkspaces().catch(() => [] as Workspace[]),
    // Pre-warm the members list so the "Memberships" link is snappy. Errors
    // are non-fatal — the members page has its own fetch.
    listWorkspaceMembers(active.nanoid).catch(() => []),
  ]);

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
      membersHref={`/${active.domain}/dashboard/members`}
    />
  );
}