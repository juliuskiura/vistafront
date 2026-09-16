import { requireWorkspace } from "@/lib/auth/server";
import {
  listWorkspaceRolePermissions,
  listWorkspaceRoles,
  type WorkspaceRoleItem,
  type WorkspaceRolePermissionItem,
} from "@/lib/api";
import { PermissionsClient } from "./permissions-client";

export default async function PermissionsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const canManage =
    active.my_role === "owner" || active.my_role === "admin";

  const [roles, permissions] = canManage
    ? await Promise.all([
        listWorkspaceRoles(active.domain).catch(() => [] as WorkspaceRoleItem[]),
        listWorkspaceRolePermissions(active.domain).catch(
          () => [] as WorkspaceRolePermissionItem[],
        ),
      ])
    : ([[], []] as [WorkspaceRoleItem[], WorkspaceRolePermissionItem[]]);

  return (
    <PermissionsClient
      workspaceDomain={active.domain}
      canManage={canManage}
      roles={roles}
      permissions={permissions}
    />
  );
}