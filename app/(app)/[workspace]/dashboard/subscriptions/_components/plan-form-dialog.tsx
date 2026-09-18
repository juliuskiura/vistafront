"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { PlanFields } from "./plan-fields";

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
        price: plan.price != null ? String(plan.price) : "",
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
          <PlanFields
            editing={editing}
            defaults={defaults}
            errors={errors}
            formError={formError}
            pending={pending}
            submitLabel={editing ? "Save changes" : "Create plan"}
            submitPendingLabel="Saving…"
            onCancel={() => onOpenChange(false)}
          >
            {editing ? (
              <input type="hidden" name="nanoid" value={plan!.nanoid} />
            ) : null}
          </PlanFields>
        </form>
      </DialogContent>
    </Dialog>
  );
}