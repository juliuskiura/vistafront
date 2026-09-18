"use client";

import { useActionState, useEffect, useRef } from "react";
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
import { useToast } from "@/lib/context";
import type { SubsPlan } from "@/lib/api";
import {
  createPlanAction,
  updatePlanAction,
} from "../actions";
import {
  initialActionState,
  type ActionState,
} from "../action-state";

interface Props {
  mode: "create" | "edit";
  plan: SubsPlan | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanFormDialog({
  mode,
  plan,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const action = mode === "create" ? createPlanAction : updatePlanAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    initialActionState,
  );

  const handledState = useRef<ActionState>(initialActionState);

  useEffect(() => {
    if (handledState.current === state) return;
    handledState.current = state;
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
        name: plan.name,
        label: plan.label,
        description: plan.description ?? "",
        order: plan.order ?? 0,
        price: plan.price ?? "",
        is_active: plan.is_active,
      }
    : {
        name: "",
        label: "",
        description: "",
        order: 0,
        price: "",
        is_active: true,
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
              ? "Change the plan's name, label, pricing, or visibility."
              : "Plans define what organizations can access: their feature list and monthly price."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          className="space-y-4"
          noValidate
          key={editing ? plan?.nanoid : "create"}
        >
          {editing ? (
            <input type="hidden" name="nanoid" value={plan!.nanoid} />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Plan name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. Growth"
                defaultValue={defaults.name}
                aria-invalid={!!errors.name}
                autoFocus={!editing}
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
            <div className="space-y-2">
              <Label htmlFor="price">Price (Ksh / month)</Label>
              <Input
                id="price"
                name="price"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 2500 — empty for custom"
                defaultValue={defaults.price}
                aria-invalid={!!errors.price}
              />
              {errors.price?.[0] ? (
                <p className="text-xs text-destructive">{errors.price[0]}</p>
              ) : null}
            </div>
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