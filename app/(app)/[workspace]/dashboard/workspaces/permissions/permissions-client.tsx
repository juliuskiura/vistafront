"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  KeyRound,
  Lock,
  RotateCcw,
  Save,
  Shield,
  ShieldCheck,
} from "lucide-react";

import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { Card } from "@/components/ui/card";
import { useToast } from "@/lib/context";
import { cn } from "@/lib/utils";
import type {
  AvailableModelApp,
  PermissionAction,
  WorkspaceRoleItem,
  WorkspaceRolePermissionItem,
} from "@/lib/api";
import { saveRolePermissionsAction } from "./actions";
import { PermissionMatrix } from "./_components/permission-matrix";

interface Props {
  workspaceDomain: string;
  canManage: boolean;
  roles: WorkspaceRoleItem[];
  permissions: WorkspaceRolePermissionItem[];
  availableModels: AvailableModelApp[];
  actions: PermissionAction[];
  initialRole?: string;
}

export function PermissionsClient({
  workspaceDomain,
  canManage,
  roles,
  permissions,
  availableModels,
  actions,
  initialRole,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [selectedRole, setSelectedRole] = useState(
    initialRole && roles.some((role) => role.nanoid === initialRole)
      ? initialRole
      : (roles[0]?.nanoid ?? ""),
  );
  const [draft, setDraft] = useState<{
    role: string;
    values: Record<string, number>;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const basePath = `/${workspaceDomain}/dashboard/workspaces`;

  const base = useMemo(() => {
    const map: Record<string, number> = {};
    for (const permission of permissions) {
      if (permission.role === selectedRole) map[permission.model] = permission.mask;
    }
    return map;
  }, [permissions, selectedRole]);

  const values = draft && draft.role === selectedRole ? draft.values : base;

  const models = useMemo(
    () => availableModels.flatMap((app) => app.models),
    [availableModels],
  );

  const dirty = useMemo(
    () =>
      models.some((model) => (values[model.key] ?? 0) !== (base[model.key] ?? 0)),
    [models, values, base],
  );

  const grantedCount = useMemo(
    () => models.filter((model) => (values[model.key] ?? 0) > 0).length,
    [models, values],
  );

  function update(
    mutator: (current: Record<string, number>) => Record<string, number>,
  ) {
    setDraft((prev) => {
      const current = prev && prev.role === selectedRole ? prev.values : base;
      return { role: selectedRole, values: mutator(current) };
    });
  }

  function handleToggle(modelKey: string, bit: number) {
    update((current) => {
      const mask = current[modelKey] ?? 0;
      const next = (mask & bit) === bit ? mask & ~bit : mask | bit;
      return { ...current, [modelKey]: next };
    });
  }

  function handleSetAll(modelKey: string, mask: number) {
    update((current) => ({ ...current, [modelKey]: mask }));
  }

  function handleSave() {
    const changes = models
      .map((model) => ({ model: model.key, mask: values[model.key] ?? 0 }))
      .filter((change) => change.mask !== (base[change.model] ?? 0));
    if (changes.length === 0) return;

    startTransition(async () => {
      const result = await saveRolePermissionsAction({
        role: selectedRole,
        workspace: workspaceDomain,
        changes,
      });
      toast.push({
        variant: result.status === "success" ? "success" : "error",
        message: result.message,
      });
      if (result.status === "success") {
        setDraft(null);
        router.refresh();
      }
    });
  }

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
          Only workspace owners and admins can grant permissions to roles. Ask an
          admin in your workspace to make changes here.
        </p>
        <VSButton appearance="outline" size="md" asChild className="mt-5">
          <Link href={basePath}>
            Back to overview <ArrowRight className="size-3.5" />
          </Link>
        </VSButton>
      </Card>
    );
  }

  const selectedRoleName =
    roles.find((role) => role.nanoid === selectedRole)?.name ?? "role";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Permissions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tick the actions each role may perform on a model, then save. Models
            come from the apps your organization has paid for.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {dirty ? (
            <VSButton
              appearance="outline"
              onClick={() => setDraft(null)}
              disabled={pending}
            >
              <RotateCcw className="size-4" />
              Discard
            </VSButton>
          ) : null}
          <VSButton
            appearance="threeD"
            onClick={handleSave}
            disabled={!dirty || pending || !selectedRole}
          >
            <Save className="size-4" />
            {pending ? "Saving…" : "Save changes"}
          </VSButton>
        </div>
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
      ) : availableModels.length === 0 ? (
        <Card className="rounded-2xl border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-secondary-50 text-secondary-600">
            <KeyRound className="size-6" />
          </div>
          <h2 className="text-base font-semibold">No apps in your plan</h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            This workspace has no paid apps with configurable permissions yet.
            Add an app to your organization&apos;s plan to manage role access.
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {roles.map((role) => (
              <button
                key={role.nanoid}
                type="button"
                onClick={() => {
                  setSelectedRole(role.nanoid);
                  setDraft(null);
                }}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  selectedRole === role.nanoid
                    ? "border-primary-600 bg-primary-50 text-primary-700"
                    : "border-neutral-200 bg-card text-muted-foreground hover:border-primary-300 hover:text-neutral-900",
                )}
              >
                {role.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-primary-600" />
            <span>
              <span className="font-semibold text-neutral-900">
                {grantedCount}
              </span>{" "}
              of {models.length} models grant access to{" "}
              <span className="font-medium text-neutral-900">
                {selectedRoleName}
              </span>
              .
            </span>
          </div>

          <PermissionMatrix
            actions={actions}
            models={models}
            values={values}
            onToggle={handleToggle}
            onSetAll={handleSetAll}
          />
        </>
      )}
    </div>
  );
}
