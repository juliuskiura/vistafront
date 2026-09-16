import { requireWorkspace } from "@/lib/auth/server";
import { listWorkspaceRoles, type WorkspaceRoleItem } from "@/lib/api";
import { RolesClient } from "./roles-client";

export default async function RolesPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const canManage =
    active.my_role === "owner" || active.my_role === "admin";

  const roles: WorkspaceRoleItem[] = canManage
    ? await listWorkspaceRoles(active.domain).catch(() => [])
    : [];

  return (
    <RolesClient
      workspaceNanoid={active.nanoid}
      workspaceDomain={active.domain}
      canManage={canManage}
      roles={roles}
    />
  );
}