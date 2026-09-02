"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, Building2, UserPlus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { useToast } from "@/lib/context";
import {
  initialInviteState,
  sendInviteAction,
  type InviteActionState,
} from "@/app/(app)/[workspace]/dashboard/workspaces/actions";
import type { Workspace, WorkspaceRole } from "@/lib/api";

const ROLE_LABEL: Record<WorkspaceRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

interface Props {
  active: {
    nanoid: string;
    name: string;
    domain: string;
    myRole: WorkspaceRole | null;
  };
  workspaces: Array<{
    nanoid: string;
    name: string;
    domain: string;
    myRole: WorkspaceRole | null;
  }>;
  /**
   * Workspace-scoped path to the members page (e.g. `/acme/dashboard/members`).
   */
  membersHref: string;
}

export function WorkspacesList({ active, workspaces, membersHref }: Props) {
  const canInvite =
    !!active.myRole && (active.myRole === "owner" || active.myRole === "admin");
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Workspaces</h1>
          <p className="text-sm text-muted-foreground">
            Workspaces you belong to. Select one to make it active.
          </p>
        </div>
        {canInvite ? (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus size={16} className="mr-1.5" />
            Invite members
          </Button>
        ) : null}
      </div>

      <Card className="rounded-xl border bg-card p-2">
        <Link
          href={membersHref}
          className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-medium hover:bg-muted"
        >
          <span className="flex items-center gap-2">
            <Building2 size={16} className="text-muted-foreground" />
            Memberships
          </span>
          <ArrowUpRight size={16} className="text-muted-foreground" />
        </Link>
      </Card>

      {workspaces.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          You are not a member of any workspace yet.
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {workspaces.map((w) => (
            <WorkspaceCard key={w.nanoid} ws={w} isActive={w.nanoid === active.nanoid} />
          ))}
        </div>
      )}

      {canInvite ? (
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          workspace={{ nanoid: active.nanoid, name: active.name }}
        />
      ) : null}
    </div>
  );
}

function WorkspaceCard({
  ws,
  isActive,
}: {
  ws: { nanoid: string; name: string; domain: string; myRole: WorkspaceRole | null };
  isActive: boolean;
}) {
  return (
    <Card
      className={`rounded-xl border bg-card p-4 ${isActive ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{ws.name}</p>
          <p className="truncate text-xs text-muted-foreground">/{ws.domain}</p>
        </div>
        {ws.myRole ? (
          <Badge variant={ws.myRole === "owner" ? "default" : "secondary"}>
            {ROLE_LABEL[ws.myRole]}
          </Badge>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        {isActive ? (
          <Button size="sm" variant="secondary" disabled>
            Active
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/${ws.domain}/dashboard/workspaces`}>Switch to</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

interface InviteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string };
}

function InviteDialog({ open, onOpenChange, workspace }: InviteDialogProps) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<InviteActionState, FormData>(
    sendInviteAction,
    initialInviteState,
  );
  const [role, setRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    if (state.status === "success") {
      toast.push({ variant: "success", message: state.message ?? "Invitation sent." });
      onOpenChange(false);
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({ variant: "error", message: state.message ?? "Could not send invite." });
    }
  }, [state, toast, onOpenChange]);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0 ? state.message : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          // Prevent auto-focus on the close button so the email field gets it.
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Invite a member</DialogTitle>
          <DialogDescription>
            Send an invitation to join <strong>{workspace.name}</strong>. The
            invitee will receive an email with a one-time code.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            fd.set("workspace", workspace.nanoid);
            fd.set("role", role);
            formAction(fd);
          }}
          className="space-y-4"
          noValidate
          onSubmit={() => {
            // Optimistically refresh when the action completes successfully.
            // The revalidatePath inside the action handles the data; we nudge
            // the route so Server Components re-fetch immediately.
            setTimeout(() => router.refresh(), 0);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="invite-first-name">First name</Label>
              <Input
                id="invite-first-name"
                name="first_name"
                required
                autoFocus
                aria-invalid={!!errors.first_name}
              />
              {errors.first_name?.[0] ? (
                <p className="text-xs text-destructive">{errors.first_name[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-last-name">Last name</Label>
              <Input id="invite-last-name" name="last_name" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              aria-invalid={!!errors.email}
            />
            {errors.email?.[0] ? (
              <p className="text-xs text-destructive">{errors.email[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value === "admin" ? "admin" : "member")}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <p className="text-xs text-muted-foreground">
              Admins can invite others and manage members. Owners are added
              automatically when creating a workspace.
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}