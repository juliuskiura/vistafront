"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/context";
import type {
  ClientBusiness,
  SubsPlan,
  Subscription,
  SubscriptionStatus,
} from "@/lib/api";
import { deleteSubscriptionAction } from "../actions";
import { SubscriptionDialog } from "./subscription-dialog";

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
                    {businessName(sub)}
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
        title={`Delete subscription for "${deleteTarget ? businessName(deleteTarget) : "this org"}"?`}
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

function businessName(sub: Subscription): string {
  const cb = sub.client_business;
  if (typeof cb === "object" && cb) return cb.name;
  return "Unknown org";
}