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
import { addPlanFeaturesAction, upsertPlanFeatureAction } from "../feature-actions";
import {
  initialActionState,
  type ActionState,
} from "../action-state";
import { FeatureCheckList } from "./feature-check-list";

interface Props {
  mode: "create" | "edit";
  planNanoid: string;
  feature: PlanFeature | null;
  /** Feature keys already assigned to this plan (shown with a checkmark). */
  addedKeys: string[];
  featureOptions: RegistryFeature[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FeatureDialog({
  mode,
  planNanoid,
  feature,
  addedKeys,
  featureOptions,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const editing = mode === "edit" && feature !== null;

  // Create mode submits every checked feature as one bulk payload; edit mode
  // updates a single existing row.
  const action = editing ? upsertPlanFeatureAction : addPlanFeaturesAction;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    action,
    initialActionState,
  );

  const [selected, setSelected] = useState<string[]>(
    editing ? [feature!.feature] : [],
  );
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

  // When editing, the row being changed stays editable; every other key that
  // is already on the plan renders read-only (checkmark, no checkbox).
  const lockedKeys = editing
    ? addedKeys.filter((k) => k !== feature!.feature)
    : addedKeys;

  const toggle = (key: string) => {
    if (editing) {
      setSelected(selected.includes(key) ? [] : [key]);
    } else {
      setSelected((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{editing ? "Edit feature" : "Add features"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Change which registered feature this plan grants."
              : "Check the features to add. Features already on the plan show a checkmark and cannot be selected again."}
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

          <div className="space-y-2">
            <Label>Feature</Label>
            <FeatureCheckList
              options={featureOptions}
              addedKeys={lockedKeys}
              selected={selected}
              onToggle={toggle}
              invalid={!!errors.feature}
            />
            {errors.feature?.[0] ? (
              <p className="text-xs text-destructive">{errors.feature[0]}</p>
            ) : editing ? (
              <p className="text-xs text-muted-foreground">
                The selected key is saved as the plan&apos;s feature.
              </p>
            ) : null}
          </div>

          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="description">
                Description{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
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
          ) : null}

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
            <Button
              type="submit"
              disabled={pending || selected.length === 0}
            >
              {pending
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : selected.length > 1
                    ? `Add ${selected.length} features`
                    : "Add feature"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}