"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import type { ClientBusiness, SubsPlan, Subscription } from "@/lib/api";
import {
  createSubscriptionAction,
  updateSubscriptionAction,
} from "../actions";
import {
  initialActionState,
  type ActionState,
} from "../action-state";
import { SearchableSelect } from "./searchable-select";

interface Props {
  mode: "create" | "edit";
  subscription?: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubsPlan[];
  clientBusinesses: ClientBusiness[];
}

function nanoidOf(value: unknown): string {
  if (typeof value === "object" && value) {
    return (value as { nanoid: string }).nanoid ?? "";
  }
  return (value as string | undefined) ?? "";
}

export function SubscriptionDialog({
  mode,
  subscription,
  open,
  onOpenChange,
  plans,
  clientBusinesses,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const editing = mode === "edit" && subscription !== undefined;
  const action = editing ? updateSubscriptionAction : createSubscriptionAction;
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

  const [planValue, setPlanValue] = useState(() =>
    nanoidOf(subscription?.plan),
  );
  const [businessValue, setBusinessValue] = useState(() =>
    nanoidOf(subscription?.client_business),
  );

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  const activePlans =
    plans.filter((plan) => plan.is_active).length > 0
      ? plans.filter((plan) => plan.is_active)
      : plans;

  const planOptions = useMemo(
    () =>
      activePlans.map((plan) => ({
        value: plan.nanoid,
        label: plan.label,
        meta: `/${plan.slug}`,
      })),
    [activePlans],
  );

  const businessOptions = useMemo(
    () =>
      clientBusinesses.map((business) => ({
        value: business.nanoid,
        label: business.legal_name,
        meta: business.business_email || business.city || undefined,
      })),
    [clientBusinesses],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit subscription" : "New subscription"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Change the plan or status for ${
                  typeof subscription?.client_business === "object" &&
                  subscription.client_business
                    ? subscription.client_business.name
                    : "this org"
                }.`
              : "Attach a plan to an organization."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4" noValidate>
          {editing ? (
            <input type="hidden" name="nanoid" value={subscription!.nanoid} />
          ) : null}
          {!editing ? (
            <input type="hidden" name="client_business" value={businessValue} />
          ) : null}
          <input type="hidden" name="plan" value={planValue} />

          {!editing ? (
            <div className="space-y-2">
              <Label>Organization</Label>
              <SearchableSelect
                value={businessValue}
                options={businessOptions}
                onChange={setBusinessValue}
                placeholder="Select an organization…"
                searchPlaceholder="Search organizations…"
                emptyLabel="No organizations match"
                ariaInvalid={!!errors.client_business}
              />
              {errors.client_business?.[0] ? (
                <p className="text-xs text-destructive">
                  {errors.client_business[0]}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label>{editing ? "Plan" : "Plan (from catalog)"}</Label>
            <SearchableSelect
              value={planValue}
              options={planOptions}
              onChange={setPlanValue}
              placeholder="Select a plan…"
              searchPlaceholder="Search plans…"
              emptyLabel="No plans match"
              ariaInvalid={!!errors.plan}
            />
            {errors.plan?.[0] ? (
              <p className="text-xs text-destructive">{errors.plan[0]}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={subscription?.status ?? "active"}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="past_due">Past due</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <label className="flex items-center gap-3">
            <input type="hidden" name="cancel_at_period_end" value="off" />
            <input
              type="checkbox"
              name="cancel_at_period_end"
              value="on"
              defaultChecked={subscription?.cancel_at_period_end ?? false}
              className="size-4 rounded border-input"
            />
            <span className="text-sm font-medium">
              Cancel at end of current period
            </span>
          </label>

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
              {pending ? "Saving…" : editing ? "Save changes" : "Create subscription"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}