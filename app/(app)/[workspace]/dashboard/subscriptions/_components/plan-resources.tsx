"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/lib/context";
import type { PlanFeature, RegistryFeature, SubsPlan } from "@/lib/api";
import { deletePlanFeatureAction } from "../feature-actions";
import { FeatureDialog } from "./feature-dialog";

interface Props {
  plan: SubsPlan;
  featureOptions: RegistryFeature[];
}

type DialogTarget =
  | { mode: "create"; feature: null }
  | { mode: "edit"; feature: PlanFeature };

export function PlanResources({ plan, featureOptions }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [featureToDelete, setFeatureToDelete] = useState<PlanFeature | null>(
    null,
  );
  const [dialog, setDialog] = useState<DialogTarget | null>(null);

  const features = plan.features ?? [];

  return (
    <div className="grid gap-6 border-t bg-sidebar/30 p-4">
      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">
            Features{" "}
            <span className="font-normal text-muted-foreground">
              (order: top to bottom)
            </span>
          </h3>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialog({ mode: "create", feature: null })}
          >
            <Plus className="size-4" />
            Add feature
          </Button>
        </div>
        <ul className="mt-2 space-y-1.5">
          {features.length === 0 ? (
            <li className="text-sm text-muted-foreground">
              No features yet — add the first one.
            </li>
          ) : (
            features.map((f, i) => (
              <li
                key={f.nanoid ?? `${f.feature}-${i}`}
                className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <Check className="size-4 shrink-0 text-emerald-500" />
                <span className="min-w-0 flex-1">
                  <span className="block">{f.feature}</span>
                  {f.description ? (
                    <span className="block text-xs text-muted-foreground">
                      {f.description}
                    </span>
                  ) : null}
                </span>
                <button
                  type="button"
                  onClick={() => setDialog({ mode: "edit", feature: f })}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label={`Edit feature: ${f.feature}`}
                >
                  <Pencil className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setFeatureToDelete(f)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove feature: ${f.feature}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </section>

      {dialog ? (
        <FeatureDialog
          key={dialog.mode === "edit" ? dialog.feature.nanoid : "create"}
          mode={dialog.mode}
          planNanoid={plan.nanoid}
          feature={dialog.feature}
          addedKeys={features.map((f) => f.feature)}
          featureOptions={featureOptions}
          open
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={featureToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFeatureToDelete(null);
        }}
        title={`Remove "${featureToDelete?.feature}"?`}
        description="This headline is removed from the plan's feature list."
        confirmLabel="Remove feature"
        variant="destructive"
        onConfirm={async () => {
          if (!featureToDelete) return;
          const result = await deletePlanFeatureAction(featureToDelete.nanoid);
          if (!result.ok) {
            toast.push({ variant: "error", message: result.error ?? "Failed." });
          }
          setFeatureToDelete(null);
          router.refresh();
        }}
      />
    </div>
  );
}