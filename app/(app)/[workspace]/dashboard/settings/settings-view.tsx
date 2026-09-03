"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import {
  initialSettingsState,
  leaveWorkspaceAction,
  updateWorkspaceAction,
  type SettingsActionState,
} from "@/app/(app)/[workspace]/dashboard/settings/actions";
import type { WorkspaceRole } from "@/lib/api";

interface Props {
  workspace: {
    nanoid: string;
    name: string;
    domain: string;
  };
  /** Only owners/admins can edit settings. */
  myRole: WorkspaceRole | null;
  /** Workspace-scoped path to the members page. */
  membersHref: string;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function WorkspaceSettingsView({
  workspace,
  myRole,
  membersHref,
}: Props) {
  const canEdit = myRole === "owner" || myRole === "admin";

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Workspace settings</h1>
        <p className="text-sm text-muted-foreground">
          {canEdit
            ? "Rename the workspace, change its URL slug, or manage your membership."
            : "Workspace basics. Only owners and admins can change these."}
        </p>
      </div>

      {canEdit ? (
        <DetailsCard workspace={workspace} />
      ) : (
        <ReadOnlyCard workspace={workspace} />
      )}

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <a
            href={membersHref}
            className="text-sm font-medium text-primary hover:underline"
          >
            Manage members →
          </a>
          <LeaveSection workspace={workspace} />
        </CardContent>
      </Card>
    </div>
  );
}

function DetailsCard({ workspace }: { workspace: { nanoid: string; name: string; domain: string } }) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    updateWorkspaceAction,
    initialSettingsState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.push({ variant: "success", message: state.message ?? "Saved." });
      router.refresh();
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not save your changes.",
      });
    }
  }, [state, toast, router]);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <Card className="rounded-xl border bg-card">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4" noValidate>
          <input type="hidden" name="nanoid" value={workspace.nanoid} />

          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace name</Label>
            <Input
              id="workspace-name"
              name="name"
              defaultValue={workspace.name}
              required
              aria-invalid={!!errors.name}
            />
            {errors.name?.[0] ? (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="workspace-domain">Domain (URL slug)</Label>
            <Input
              id="workspace-domain"
              name="domain"
              defaultValue={workspace.domain}
              required
              aria-invalid={!!errors.domain}
              onBlur={(e) => {
                const slug = slugify(e.currentTarget.value);
                if (slug && slug !== e.currentTarget.value) {
                  e.currentTarget.value = slug;
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Used as the path slug in the URL: <code>/{workspace.domain}/…</code>.
              Changing this redirects your team to the new URL.
            </p>
            {errors.domain?.[0] ? (
              <p className="text-xs text-destructive">{errors.domain[0]}</p>
            ) : null}
          </div>

          {formError ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-3">
            {state.status === "success" && state.message ? (
              <p className="text-xs text-emerald-600">{state.message}</p>
            ) : null}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ReadOnlyCard({
  workspace,
}: {
  workspace: { name: string; domain: string };
}) {
  return (
    <Card className="rounded-xl border bg-card">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Name</p>
          <p className="font-medium">{workspace.name}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Domain</p>
          <p className="font-medium">/{workspace.domain}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaveSection({
  workspace,
}: {
  workspace: { nanoid: string; name: string };
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<SettingsActionState, FormData>(
    leaveWorkspaceAction,
    initialSettingsState,
  );

  useEffect(() => {
    if (state.status === "error") {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not leave the workspace.",
      });
    }
  }, [state, toast]);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (
          !confirm(
            `Leave ${workspace.name}? You'll lose access until an owner invites you again.`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-2 border-t pt-3"
    >
      <input type="hidden" name="nanoid" value={workspace.nanoid} />
      <p className="text-xs text-muted-foreground">
        Leaving the workspace removes you from the member list. The
        workspace itself, its projects, and its data are preserved.
      </p>
      <Button
        type="submit"
        variant="destructive"
        size="sm"
        disabled={pending}
        className="gap-2"
      >
        <LogOut className="size-4" />
        {pending ? "Leaving…" : "Leave workspace"}
      </Button>
    </form>
  );
}