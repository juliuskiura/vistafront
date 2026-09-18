"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/context";
import type { RegistryFeature, SubsPlan } from "@/lib/api";
import { deletePlanAction } from "../actions";
import { PlanFormDialog } from "../_components/plan-form-dialog";
import { PlanResources } from "../_components/plan-resources";

export function PlansClient({
  plans,
  featureOptions,
}: {
  plans: SubsPlan[];
  featureOptions: RegistryFeature[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editPlan, setEditPlan] = useState<SubsPlan | null>(null);
  const [deletePlan, setDeletePlan] = useState<SubsPlan | null>(null);

  return (
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
                      <Package className="size-4 shrink-0 text-muted-foreground" />
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
                <PlanResources plan={plan} featureOptions={featureOptions} />
              )}
            </Card>
          );
        })
      )}

      <PlanFormDialog
        key={editPlan?.nanoid ?? "closed"}
        mode="edit"
        plan={editPlan}
        open={editPlan !== null}
        onOpenChange={(open) => {
          if (!open) setEditPlan(null);
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