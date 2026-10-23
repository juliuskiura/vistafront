"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import { createTierClassificationAction } from "@/app/(app)/[workspace]/dashboard/companies/actions";
import {
  initialCreateTierClassificationState,
  type CreateTierClassificationActionState,
} from "@/app/(app)/[workspace]/dashboard/companies/action-state";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string; domain: string };
}

/**
 * The "New Tier" dialog.
 *
 * A tier classifies a company by value (A, B, C) with a human title
 * ("Strategic"). The description is stored as rich text in a JSON field, so
 * it is sent as `{ html: "…" }` — the shape the legacy app used.
 */
export function AddTierDialog({ open, onOpenChange, workspace }: Props) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<
    CreateTierClassificationActionState,
    FormData
  >(createTierClassificationAction, initialCreateTierClassificationState);
  const handledState = useRef<CreateTierClassificationActionState>(
    initialCreateTierClassificationState,
  );
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (handledState.current === state) return;
    handledState.current = state;
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Tier created.",
      });
      onOpenChange(false);
    } else if (state.status === "error") {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not create tier.",
      });
    }
  }, [state, toast, onOpenChange]);

  // Reset the form fields when the dialog closes so the next open starts
  // from a blank slate. Done in the close handler (an event, not an
  // effect) to avoid calling setState inside an effect.
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setTitle("");
      setLabel("");
      setDescription("");
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="rounded-t-xl bg-primary px-5 py-4">
          <DialogTitle className="text-primary-foreground">New Tier</DialogTitle>
        </DialogHeader>
        <form
          action={(submitted) => {
            submitted.set("workspace_domain", workspace.domain);
            formAction(submitted);
          }}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4"
        >
          <input type="hidden" name="workspace_domain" value={workspace.domain} />
          <div className="space-y-1.5">
            <Label htmlFor="tier-title">Title</Label>
            <Input
              id="tier-title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Strategic"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tier-label">Label</Label>
            <Input
              id="tier-label"
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. A"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tier-description">Description</Label>
            <textarea
              id="tier-description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              placeholder="Optional description"
            />
          </div>
          <DialogFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
