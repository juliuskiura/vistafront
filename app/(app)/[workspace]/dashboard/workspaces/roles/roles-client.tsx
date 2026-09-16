"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  ShieldPlus,
  ShieldCheck,
  Trash2,
  Lock,
  ArrowRight,
} from "lucide-react";

import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { Fab } from "@/components/ui/fab";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/context";
import type { WorkspaceRoleItem } from "@/lib/api";
import {
  createRoleAction,
  deleteRoleAction,
  initialRoleState,
  type RoleActionState,
} from "./actions";

interface Props {
  workspaceNanoid: string;
  workspaceDomain: string;
  canManage: boolean;
  roles: WorkspaceRoleItem[];
}

export function RolesClient({
  workspaceNanoid,
  workspaceDomain,
  canManage,
  roles,
}: Props) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WorkspaceRoleItem | null>(
    null,
  );

  const basePath = `/${workspaceDomain}/dashboard/workspaces`;

  if (!canManage) {
    return (
      <Card className="mx-auto max-w-lg rounded-2xl border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
          <Lock className="size-6" />
        </div>
        <h1 className="text-lg font-semibold">Roles are managed by admins</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only workspace owners and admins can create or remove custom roles.
          Ask an admin in your workspace to make changes here.
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
          <h1 className="text-2xl font-bold tracking-tight">Roles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Custom roles group permissions so you can assign the right level of
            access to every member.
          </p>
        </div>
        <VSButton appearance="threeD" onClick={() => setCreateOpen(true)}>
          <ShieldPlus className="size-4" />
          Create Role
        </VSButton>
      </div>

      {roles.length === 0 ? (
        <Card className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
            <Shield className="size-6" />
          </div>
          <h2 className="text-base font-semibold">No roles yet</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Create your first role — for example a &quot;Content Editor&quot; — then grant
            it permissions on the Permissions page.
          </p>
          <VSButton appearance="threeD" onClick={() => setCreateOpen(true)}>
            <ShieldPlus className="size-4" />
            Create your first role
          </VSButton>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {roles.map((role) => (
            <Card
              key={role.nanoid}
              className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:shadow-md"
            >
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
                <ShieldCheck className="size-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-900">
                  {role.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {role.workspace_name || "This workspace"}
                </p>
              </div>
              <Badge variant="soft" className="shrink-0">
                {role.workspace_name ? "Custom" : "Role"}
              </Badge>
              <Fab
                type="button"
                variant="outline"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(role)}
                aria-label={`Delete ${role.name}`}
              >
                <Trash2 className="size-4" />
              </Fab>
            </Card>
          ))}
        </div>
      )}

      <CreateRoleDialog
        workspaceNanoid={workspaceNanoid}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This role will be removed and its permissions unlinked. Members assigned this role keep their membership but lose its custom access."
        confirmLabel="Delete role"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          await deleteRoleAction(deleteTarget.nanoid, workspaceDomain);
          router.refresh();
        }}
      />
    </div>
  );
}

function CreateRoleDialog({
  workspaceNanoid,
  open,
  onOpenChange,
}: {
  workspaceNanoid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<
    RoleActionState,
    FormData
  >(createRoleAction, initialRoleState);

  useEffect(() => {
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Role created.",
      });
      onOpenChange(false);
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not create role.",
      });
    }
  }, [state, toast, onOpenChange]);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Create a role</DialogTitle>
          <DialogDescription>
            Name a role that groups a level of access, then grant it permissions
            from the Permissions page.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            fd.set("workspace", workspaceNanoid);
            formAction(fd);
          }}
          className="space-y-4"
          noValidate
          onSubmit={() => {
            if (state.status !== "success") {
              setTimeout(() => router.refresh(), 0);
            }
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="role-name">Role name</Label>
            <Input
              id="role-name"
              name="name"
              placeholder="e.g. Content Editor"
              required
              maxLength={100}
              autoFocus
              aria-invalid={!!errors.name}
            />
            {errors.name?.[0] ? (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Choose a clear name you can reuse when inviting members or
              granting permissions.
            </p>
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <DialogFooter>
            <VSButton
              type="button"
              appearance="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </VSButton>
            <VSButton type="submit" appearance="threeD" disabled={pending}>
              {pending ? "Creating…" : "Create role"}
            </VSButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}