"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Lock, Package, TableProperties } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/context";
import type {
  ClientBusiness,
  RegistryFeature,
  SubsPlan,
  Subscription,
} from "@/lib/api";
import { deletePlanAction } from "./actions";
import { PlanFormDialog } from "./_components/plan-form-dialog";
import { PlanResources } from "./_components/plan-resources";
import { SubscriptionsPanel } from "./_components/subscriptions-panel";

type Tab = "plans" | "subscriptions";

export function SubscriptionsClient({
  canManage,
  plans,
  subscriptions,
  clientBusinesses,
  featureOptions,
}: {
  canManage: boolean;
  plans: SubsPlan[];
  subscriptions: Subscription[];
  clientBusinesses: ClientBusiness[];
  featureOptions: RegistryFeature[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("plans");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SubsPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<SubsPlan | null>(null);

  if (!canManage) {
    return <ReadOnlyView plans={plans} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Subscriptions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Console admin: manage the plan catalog and every organization&apos;s
            subscription.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-1 border-b border-sidebar-divider">
        {(
          [
            { key: "plans", label: "Plans", icon: Package },
            {
              key: "subscriptions",
              label: "Organizations",
              icon: TableProperties,
            },
          ] as { key: Tab; label: string; icon: typeof Package }[]
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-primary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {tab === "plans" ? (
          <div className="space-y-3">
            {plans.length === 0 ? (
              <Card className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
                No plans yet — create the first tier to get started.
              </Card>
            ) : (
              plans.map((plan) => {
                const isOpen = expanded === plan.nanoid;
                return (
                  <Card
                    key={plan.nanoid}
                    className="overflow-hidden rounded-xl border bg-card"
                  >
                    <div className="flex flex-wrap items-center gap-3 p-4">
                      <button
                        type="button"
                        onClick={() => setExpanded(isOpen ? null : plan.nanoid)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <ChevronDown
                          className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-semibold">
                              {plan.label}
                            </p>
                            <span className="truncate text-xs text-muted-foreground">
                              /{plan.slug}
                            </span>
                            {plan.is_active ? (
                              <Badge variant="secondary">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </div>
                        </div>
                      </button>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditPlan(plan)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletePlan(plan)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {isOpen && (
                      <PlanResources
                        plan={plan}
                        featureOptions={featureOptions}
                      />
                    )}
                  </Card>
                );
              })
            )}
          </div>
        ) : (
          <SubscriptionsPanel
            subscriptions={subscriptions}
            plans={plans}
            clientBusinesses={clientBusinesses}
          />
        )}
      </div>

      <PlanFormDialog
        key={editPlan?.nanoid ?? (createOpen ? "create" : "closed")}
        mode={editPlan ? "edit" : "create"}
        plan={editPlan}
        open={createOpen || editPlan !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditPlan(null);
          }
        }}
      />

      <ConfirmDialog
        open={deletePlan !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePlan(null);
        }}
        title={`Delete "${deletePlan?.label ?? "plan"}"?`}
        description="This removes the plan and its feature list. Organizations currently subscribed to this plan cannot be deleted until they are moved to another plan."
        confirmLabel="Delete plan"
        variant="destructive"
        onConfirm={async () => {
          if (!deletePlan) return;
          const result = await deletePlanAction(deletePlan.nanoid);
          if (!result.ok) {
            toast.push({
              variant: "error",
              message: result.error ?? "Could not delete the plan.",
            });
          } else {
            toast.push({ variant: "success", message: "Plan deleted." });
          }
          setDeletePlan(null);
          router.refresh();
        }}
      />
    </div>
  );
}

function ReadOnlyView({ plans }: { plans: SubsPlan[] }) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          The plan catalog available on this workspace.
        </p>
      </div>
      <Card className="rounded-xl border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Lock className="size-5" />
        </div>
        <h2 className="text-base font-semibold">Admins manage this console</h2>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Only platform admins can edit the plan catalog or organization
          subscriptions.
        </p>
      </Card>
      <ul className="divide-y rounded-xl border bg-card">
        {plans.map((plan) => (
          <li
            key={plan.nanoid}
            className="flex items-center justify-between gap-3 px-4 py-3 first:pt-4 last:pb-4"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{plan.label}</p>
              <p className="truncate text-xs text-muted-foreground">/{plan.slug}</p>
            </div>
            <Badge variant="secondary">{plan.features?.length} features</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}