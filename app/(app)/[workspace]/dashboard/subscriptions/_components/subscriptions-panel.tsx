"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import type {
  ClientBusiness,
  SubsPlan,
  Subscription,
  SubscriptionStatus,
} from "@/lib/api";
import {
  createSubscriptionAction,
  updateSubscriptionAction,
  deleteSubscriptionAction,
} from "../actions";
import {
  initialActionState,
  type ActionState,
} from "../action-state";

interface Props {
  subscriptions: Subscription[];
  plans: SubsPlan[];
  clientBusinesses: ClientBusiness[];
}

export function SubscriptionsPanel({
  subscriptions,
  plans,
  clientBusinesses,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Subscription | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subscription | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {subscriptions.length} subscription
          {subscriptions.length === 1 ? "" : "s"} across organizations
        </p>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          New subscription
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
          No subscriptions yet — attach a plan to an organization.
        </Card>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {subscriptions.map((sub) => (
            <div
              key={sub.nanoid}
              className="flex flex-wrap items-center gap-3 p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Users className="size-4 shrink-0 text-muted-foreground" />
                  <p className="truncate text-sm font-semibold">
                    {sub.client_business_name ?? "Unknown org"}
                  </p>
                  <StatusBadge status={sub.status} />
                  {sub.cancel_at_period_end ? (
                    <Badge variant="outline">ends this period</Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  Plan: <span className="font-medium">{sub.plan_label ?? "—"}</span>
                  {sub.current_period_end
                    ? ` · renews ${formatDate(sub.current_period_end)}`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditTarget(sub)}
                >
                  <Pencil className="size-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteTarget(sub)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen ? (
        <SubscriptionDialog
          mode="create"
          open={createOpen}
          onOpenChange={setCreateOpen}
          plans={plans}
          clientBusinesses={clientBusinesses}
        />
      ) : null}
      {editTarget ? (
        <SubscriptionDialog
          mode="edit"
          subscription={editTarget}
          open={editTarget !== null}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
          plans={plans}
          clientBusinesses={clientBusinesses}
        />
      ) : null}

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Delete subscription for "${deleteTarget?.client_business_name ?? "this org"}"?`}
        description="The organization immediately loses the plan's apps and features until a new subscription is created."
        confirmLabel="Delete subscription"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteSubscriptionAction(deleteTarget.nanoid);
          if (!result.ok) {
            toast.push({ variant: "error", message: result.error ?? "Failed." });
          } else {
            toast.push({ variant: "success", message: "Subscription deleted." });
          }
          setDeleteTarget(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: SubscriptionStatus }) {
  if (status === "active") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700">{status}</Badge>
    );
  }
  if (status === "past_due") {
    return <Badge className="bg-amber-100 text-amber-700">{status}</Badge>;
  }
  return <Badge variant="outline">{status}</Badge>;
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function planValueOf(subscription: Subscription | undefined): string {
  const plan = subscription?.plan;
  if (typeof plan === "object" && plan) return plan.nanoid;
  return (plan as string | undefined) ?? "";
}

// ── Create / edit dialog ────────────────────────────────────────────────────

interface DialogProps {
  mode: "create" | "edit";
  subscription?: Subscription;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: SubsPlan[];
  clientBusinesses: ClientBusiness[];
}

function SubscriptionDialog({
  mode,
  subscription,
  open,
  onOpenChange,
  plans,
  clientBusinesses,
}: DialogProps) {
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

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;
  const activePlans =
    plans.filter((p) => p.is_active).length > 0
      ? plans.filter((p) => p.is_active)
      : plans;

  const statusSelect = (
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
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? "Edit subscription" : "New subscription"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? `Change the plan or status for ${subscription?.client_business_name ?? "this org"}.`
              : "Attach a plan to an organization."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4" noValidate>
          {editing ? (
            <input
              type="hidden"
              name="nanoid"
              value={subscription!.nanoid}
            />
          ) : null}

          {!editing ? (
            <div className="space-y-2">
              <Label htmlFor="client_business">Organization</Label>
              <select
                id="client_business"
                name="client_business"
                defaultValue=""
                aria-invalid={!!errors.client_business}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  Select an organization…
                </option>
                {clientBusinesses.map((cb) => (
                  <option key={cb.nanoid} value={cb.nanoid}>
                    {cb.legal_name}
                  </option>
                ))}
              </select>
              {errors.client_business?.[0] ? (
                <p className="text-xs text-destructive">
                  {errors.client_business[0]}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="plan">
              {editing ? "Plan" : "Plan (from catalog)"}
            </Label>
            <select
              id="plan"
              name="plan"
              defaultValue={planValueOf(subscription)}
              aria-invalid={!!errors.plan}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Select a plan…
              </option>
              {activePlans.map((p) => (
                <option key={p.nanoid} value={p.nanoid}>
                  {p.label} ({p.slug})
                </option>
              ))}
            </select>
            {errors.plan?.[0] ? (
              <p className="text-xs text-destructive">{errors.plan[0]}</p>
            ) : null}
          </div>

          {statusSelect}

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