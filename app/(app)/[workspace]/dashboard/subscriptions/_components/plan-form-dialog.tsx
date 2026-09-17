"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/context";
import type { Plan } from "@/lib/api";
import {
  createPlanAction,
  updatePlanAction,
  initialActionState,
  type ActionState,
} from "../actions";

interface Props {
  mode: "create" | "edit";
  plan: Plan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
}

export function PlanFormDialog({
  mode,
  plan,
  open,
  onOpenChange,
  workspaceDomain,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const action = mode === "create" ? createPlanAction : updatePlanAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    initialActionState,
  );

  useEffect(() => {
    if (state.status === "success") {
      toast.push({ variant: "success", message: state.message ?? "Saved." });
      onOpenChange(false);
      router.refresh();
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({ variant: "error", message: state.message ?? "Could not save." });
    }
  }, [state, toast, onOpenChange, router]);

  const editing = mode === "edit" && plan !== null;
  const defaults = plan
    ? {
        slug: plan.slug,
        name: plan.name,
        label: plan.label,
        description: plan.description ?? "",
        order: plan.order,
        is_active: plan.is_active,
        seat_limit: plan.seat_limit ?? "",
        price_per_seat: plan.price_per_seat ?? "",
        includes_enterprise_features: plan.includes_enterprise_features,
        features: (plan.features ?? []).map((f) => f.feature).join("\n"),
      }
    : {
        slug: "",
        name: "",
        label: "",
        description: "",
        order: 0,
        is_active: true,
        seat_limit: "",
        price_per_seat: "",
        includes_enterprise_features: false,
        features: "",
      };

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{editing ? "Edit plan" : "Create a plan"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "The slug is permanent after creation — change the rest freely."
              : "Plans define what organizations can access: features, app bindings, seats, and price."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          className="space-y-4"
          noValidate
          key={editing ? plan?.nanoid : "create"}
        >
          <input type="hidden" name="workspace" value={workspaceDomain} />
          {editing ? <input type="hidden" name="slug" value={plan!.slug} /> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                placeholder="e.g. growth"
                disabled={editing}
                defaultValue={defaults.slug}
                aria-invalid={!!errors.slug}
                autoFocus={!editing}
              />
              {errors.slug?.[0] ? (
                <p className="text-xs text-destructive">{errors.slug[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="order">Display order</Label>
              <Input
                id="order"
                name="order"
                type="number"
                min={0}
                inputMode="numeric"
                defaultValue={defaults.order}
                aria-invalid={!!errors.order}
              />
              {errors.order?.[0] ? (
                <p className="text-xs text-destructive">{errors.order[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plan name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Growth"
                defaultValue={defaults.name}
                aria-invalid={!!errors.name}
              />
              {errors.name?.[0] ? (
                <p className="text-xs text-destructive">{errors.name[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                name="label"
                placeholder="e.g. For growing teams"
                defaultValue={defaults.label}
                aria-invalid={!!errors.label}
              />
              {errors.label?.[0] ? (
                <p className="text-xs text-destructive">{errors.label[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              placeholder="Short summary shown on the plan card"
              defaultValue={defaults.description}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seat_limit">Seat limit</Label>
              <Input
                id="seat_limit"
                name="seat_limit"
                type="number"
                min={0}
                inputMode="numeric"
                placeholder="Leave empty for unlimited"
                defaultValue={defaults.seat_limit}
                aria-invalid={!!errors.seat_limit}
              />
              {errors.seat_limit?.[0] ? (
                <p className="text-xs text-destructive">{errors.seat_limit[0]}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_per_seat">Price per seat (Ksh)</Label>
              <Input
                id="price_per_seat"
                name="price_per_seat"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 2500"
                defaultValue={defaults.price_per_seat}
                aria-invalid={!!errors.price_per_seat}
              />
              {errors.price_per_seat?.[0] ? (
                <p className="text-xs text-destructive">{errors.price_per_seat[0]}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feature_text">
              Features{" "}
              <span className="font-normal text-muted-foreground">
                (one per line)
              </span>
            </Label>
            <Textarea
              id="feature_text"
              name="feature_text"
              rows={4}
              className="min-h-[90px]"
              placeholder={"Unlimited projects\nPriority support"}
              defaultValue={defaults.features}
            />
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-3">
              <input type="hidden" name="is_active" value="off" />
              <input
                type="checkbox"
                name="is_active"
                value="on"
                defaultChecked={defaults.is_active}
                className="size-4 rounded border-input"
              />
              <span className="text-sm font-medium">Active (visible to customers)</span>
            </label>
            <label className="flex items-center gap-3">
              <input type="hidden" name="includes_enterprise_features" value="off" />
              <input
                type="checkbox"
                name="includes_enterprise_features"
                value="on"
                defaultChecked={defaults.includes_enterprise_features}
                className="size-4 rounded border-input"
              />
              <span className="text-sm font-medium">
                Includes enterprise features
              </span>
            </label>
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
              {pending ? "Saving…" : editing ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}