import {
  listWorkspaceMembers,
  type WorkspaceMember,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { MembersView } from "@/app/(app)/[workspace]/dashboard/members/members-view";

/**
 * Members page (Server Component).
 *
 * Lists every member of the active workspace, with the current user's role
 * badge and (for owner/admin) an "Invite members" trigger that reuses the
 * shared dialog from the Workspaces feature.
 */
export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const members: WorkspaceMember[] = await listWorkspaceMembers(
    active.nanoid,
    active.domain,
  ).catch(() => []);

  return (
    <MembersView
      active={{
        nanoid: active.nanoid,
        name: active.name,
        myRole: active.my_role,
      }}
      members={members}
    />
  );
}