import { requireWorkspace } from "@/lib/auth/server";
import { WorkspaceSettingsView } from "@/app/(app)/[workspace]/dashboard/settings/settings-view";

/**
 * Workspace settings (Server Component).
 *
 * Reads the active workspace from the URL slug, then hands the read-only +
 * editable sections to the Client Component. Owners and admins get the
 * editable details card; everyone can leave the workspace.
 */
export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <WorkspaceSettingsView
      workspace={{
        nanoid: active.nanoid,
        name: active.name,
        domain: active.domain,
      }}
      myRole={active.my_role}
      membersHref={`/${active.domain}/dashboard/members`}
    />
  );
}