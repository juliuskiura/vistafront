"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  KeyRound,
  Lock,
  Shield,
  ShieldPlus,
  Trash2,
  ArrowRight,
} from "lucide-react";

import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { Fab } from "@/components/ui/fab";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type {
  WorkspaceRoleItem,
  WorkspaceRolePermissionItem,
} from "@/lib/api";
import { deletePermissionAction } from "./actions";
import { CreatePermissionDialog } from "./_components/create-permission-dialog";

interface Props {
  workspaceDomain: string;
  canManage: boolean;
  roles: WorkspaceRoleItem[];
  permissions: WorkspaceRolePermissionItem[];
}

export function PermissionsClient({
  workspaceDomain,
  canManage,
  roles,
  permissions,
}: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<WorkspaceRolePermissionItem | null>(null);

  const basePath = `/${workspaceDomain}/dashboard/workspaces`;

  if (!canManage) {
    return (
      <Card className="mx-auto max-w-lg rounded-2xl border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <Lock className="size-6" />
        </div>
        <h1 className="text-lg font-semibold">
          Permissions are managed by admins
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only workspace owners and admins can grant permissions to roles. Ask
          an admin in your workspace to make changes here.
        </p>
        <VSButton appearance="outline" size="md" asChild className="mt-5">
          <Link href={basePath}>
            Back to overview <ArrowRight className="size-3.5" />
          </Link>
        </VSButton>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Decide which roles can access each feature of this workspace. A
            permission pairs a role with a model and an access mask.
          </p>
        </div>
        <VSButton appearance="threeD" onClick={() => setCreateOpen(true)} disabled={roles.length === 0}>
          <ShieldPlus className="size-4" />
          New Permission
        </VSButton>
      </div>

      {roles.length === 0 ? (
        <Card className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Shield className="size-6" />
          </div>
          <h2 className="text-base font-semibold">Create a role first</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Permissions are granted to roles. Head to the Roles page to create
            your first role, then come back to grant it access.
          </p>
          <VSButton appearance="threeD" asChild>
            <Link href={`${basePath}/roles`}>
              Go to Roles <ArrowRight className="size-4" />
            </Link>
          </VSButton>
        </Card>
      ) : permissions.length === 0 ? (
        <Card className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600">
            <KeyRound className="size-6" />
          </div>
          <h2 className="text-base font-semibold">No permissions yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Grant your first permission — pick a role, the model it should
            access, and the access mask.
          </p>
          <VSButton appearance="threeD" onClick={() => setCreateOpen(true)}>
            <ShieldPlus className="size-4" />
            Grant a permission
          </VSButton>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Mask</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-muted">
              {permissions.map((permission) => (
                <tr key={permission.nanoid} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                        <Shield className="size-4" />
                      </div>
                      <span className="font-medium text-neutral-900">
                        {permission.role_name || "Role"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="soft" className="font-normal">
                      {permission.model}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {permission.mask}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Fab
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setDeleteTarget(permission)}
                      aria-label="Revoke permission"
                    >
                      <Trash2 className="size-4" />
                    </Fab>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreatePermissionDialog
        workspaceDomain={workspaceDomain}
        roles={roles}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Revoke this permission?"
        description={`This will remove "${deleteTarget?.model}" access from the "${deleteTarget?.role_name || "selected"}" role. Members of the role lose this access immediately.`}
        confirmLabel="Revoke permission"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deletePermissionAction(deleteTarget.nanoid, workspaceDomain);
          router.refresh();
        }}
      />
    </div>
  );
}