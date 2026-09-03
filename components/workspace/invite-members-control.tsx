"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
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

interface Props {
  workspace: { nanoid: string; name: string };
  /**
   * Trigger label. Defaults to "Invite members".
   */
  label?: string;
  /**
   * Variant for the trigger button. Defaults to the standard primary button.
   */
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
}

/**
 * Reusable "Invite members" trigger + dialog. Opens a Radix dialog with the
 * invite form and posts to `sendInviteAction` (the Server Action colocated
 * with the Workspaces page).
 *
 * Owner / Admin gating is the caller's responsibility — only render this
 * component when `my_role` is `owner` or `admin`.
 */
export function InviteMembersControl({
  workspace,
  label = "Invite members",
  variant,
  size = "sm",
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant}
        onClick={() => setOpen(true)}
      >
        <UserPlus size={16} className="mr-1.5" />
        {label}
      </Button>
      <InviteDialog
        open={open}
        onOpenChange={setOpen}
        workspace={workspace}
      />
    </>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  workspace,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string };
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<InviteActionState, FormData>(
    sendInviteAction,
    initialInviteState,
  );
  const [role, setRole] = useState<"admin" | "member">("member");

  useEffect(() => {
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Invitation sent.",
      });
      onOpenChange(false);
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not send invite.",
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
              onChange={(e) =>
                setRole(e.target.value === "admin" ? "admin" : "member")
              }
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