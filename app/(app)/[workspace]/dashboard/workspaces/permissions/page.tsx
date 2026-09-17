import { requireWorkspace } from "@/lib/auth/server";
import {
  listAvailableModels,
  listPermissionActions,
  listWorkspaceRolePermissions,
  listWorkspaceRoles,
  type AvailableModelApp,
  type PermissionAction,
  type WorkspaceRoleItem,
  type WorkspaceRolePermissionItem,
} from "@/lib/api";
import { PermissionsClient } from "./permissions-client";

export default async function PermissionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { workspace: slug } = await params;
  const { role: initialRole } = await searchParams;
  const active = await requireWorkspace(slug);

  const canManage =
    active.my_role === "owner" || active.my_role === "admin";

  const [roles, permissions, availableModels, actions] = canManage
    ? await Promise.all([
        listWorkspaceRoles(active.domain).catch(() => [] as WorkspaceRoleItem[]),
        listWorkspaceRolePermissions(active.domain).catch(
          () => [] as WorkspaceRolePermissionItem[],
        ),
        listAvailableModels(active.domain).catch(() => [] as AvailableModelApp[]),
        listPermissionActions().catch(() => [] as PermissionAction[]),
      ])
    : ([
        [],
        [],
        [],
        [],
      ] as [
        WorkspaceRoleItem[],
        WorkspaceRolePermissionItem[],
        AvailableModelApp[],
        PermissionAction[],
      ]);

  return (
    <PermissionsClient
      workspaceDomain={active.domain}
      canManage={canManage}
      roles={roles}
      permissions={permissions}
      availableModels={availableModels}
      actions={actions}
      initialRole={initialRole}
    />
  );
}