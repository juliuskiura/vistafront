"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";

import { VSButton } from "@/components/shared/components/customUi/VSButton";
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
import type { WorkspaceRoleItem } from "@/lib/api";
import {
  createPermissionAction,
  initialPermissionState,
  type PermissionActionState,
} from "../actions";

interface Props {
  workspaceDomain: string;
  roles: WorkspaceRoleItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePermissionDialog({
  workspaceDomain,
  roles,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<
    PermissionActionState,
    FormData
  >(createPermissionAction, initialPermissionState);

  useEffect(() => {
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Permission granted.",
      });
      onOpenChange(false);
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not grant permission.",
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
          <DialogTitle>Grant a permission</DialogTitle>
          <DialogDescription>
            Choose the role that should receive access and the model it applies
            to.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(fd) => {
            fd.set("workspace", workspaceDomain);
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
            <Label htmlFor="permission-role">Role</Label>
            <select
              id="permission-role"
              name="role"
              required
              defaultValue=""
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-invalid={!!errors.role}
            >
              <option value="" disabled>
                Select a role…
              </option>
              {roles.map((role) => (
                <option key={role.nanoid} value={role.nanoid}>
                  {role.name}
                </option>
              ))}
            </select>
            {errors.role?.[0] ? (
              <p className="text-xs text-destructive">{errors.role[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission-model">Model</Label>
            <Input
              id="permission-model"
              name="model"
              placeholder="e.g. company, deal, post"
              required
              maxLength={150}
              aria-invalid={!!errors.model}
            />
            {errors.model?.[0] ? (
              <p className="text-xs text-destructive">{errors.model[0]}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              The feature or data type this role can access.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission-mask">Access mask (optional)</Label>
            <Input
              id="permission-mask"
              name="mask"
              type="number"
              min={0}
              step={1}
              placeholder="0"
              aria-invalid={!!errors.mask}
            />
            {errors.mask?.[0] ? (
              <p className="text-xs text-destructive">{errors.mask[0]}</p>
            ) : null}
            <p className="text-xs text-muted-foreground">
              A bitmask of access actions. Leave empty for full access to the
              model.
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
              {pending ? "Granting…" : "Grant permission"}
            </VSButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}