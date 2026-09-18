"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/lib/context";
import type { PlanFeature, RegistryFeature } from "@/lib/api";
import { upsertPlanFeatureAction } from "../actions";
import {
  initialActionState,
  type ActionState,
} from "../action-state";
import { FeaturePicker } from "./feature-picker";

interface Props {
  mode: "create" | "edit";
  planNanoid: string;
  feature: PlanFeature | null;
  featureOptions: RegistryFeature[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureDialog({
  mode,
  planNanoid,
  feature,
  featureOptions,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const editing = mode === "edit" && feature !== null;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    upsertPlanFeatureAction,
    initialActionState,
  );

  const [featureKey, setFeatureKey] = useState(feature?.feature ?? "");
  const [description, setDescription] = useState(feature?.description ?? "");

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

  // Selecting a registry feature seeds the description from the registry when
  // the admin hasn't written their own override yet.
  const handleSelect = (key: string) => {
    setFeatureKey(key);
    setDescription((prev) => {
      if (prev.trim()) return prev;
      return featureOptions.find((o) => o.key === key)?.description ?? "";
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit feature" : "Add feature"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Change which registered feature this plan grants."
              : "Pick a registered feature. Customers see its label and description; the key is what the plan stores."}
          </DialogDescription>
        </DialogHeader>

        <form
          action={formAction}
          className="space-y-4"
          noValidate
          key={editing ? feature!.nanoid : "create"}
        >
          {editing ? (
            <input type="hidden" name="nanoid" value={feature!.nanoid} />
          ) : (
            <input type="hidden" name="plan" value={planNanoid} />
          )}
          <input type="hidden" name="feature" value={featureKey} />

          <div className="space-y-2">
            <Label htmlFor="feature-picker">Feature</Label>
            <FeaturePicker
              id="feature-picker"
              value={featureKey}
              onChange={handleSelect}
              options={featureOptions}
              invalid={!!errors.feature}
            />
            {errors.feature?.[0] ? (
              <p className="text-xs text-destructive">{errors.feature[0]}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                The selected key is saved as the plan&apos;s feature.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              Description{" "}
              <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Explain what the customer gets"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!!errors.description}
            />
            {errors.description?.[0] ? (
              <p className="text-xs text-destructive">
                {errors.description[0]}
              </p>
            ) : null}
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
            <Button type="submit" disabled={pending || !featureKey}>
              {pending ? "Saving…" : editing ? "Save changes" : "Add feature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}