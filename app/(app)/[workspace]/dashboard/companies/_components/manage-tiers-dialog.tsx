"use client";

import { useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "@/lib/icons";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { TierClassification } from "@/lib/api";
import { useToast } from "@/lib/context";
import {
  deleteTierAction,
  updateTierAction,
} from "@/app/(app)/[workspace]/dashboard/companies/actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceDomain: string;
  tiers: TierClassification[];
}

/**
 * "Manage tiers" — rename and delete the existing tier classifications.
 *
 * The legacy app had the delete mutation but no UI for it, so a tier could
 * be created and never removed. Creating lives in its own dialog; this one
 * covers the two operations that were missing.
 */
export function ManageTiersDialog({
  open,
  onOpenChange,
  workspaceDomain,
  tiers,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<TierClassification | null>(null);
  const [title, setTitle] = useState("");
  const [label, setLabel] = useState("");
  const [deleting, setDeleting] = useState<TierClassification | null>(null);
  const [pending, startTransition] = useTransition();

  const startEdit = (tier: TierClassification) => {
    setEditing(tier);
    setTitle(tier.title);
    setLabel(tier.label);
  };

  const saveEdit = () => {
    if (!editing) return;
    startTransition(async () => {
      const result = await updateTierAction({
        workspaceDomain,
        nanoid: editing.nanoid,
        title: title.trim(),
        label: label.trim(),
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Tier updated." });
        setEditing(null);
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not update the tier.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteTierAction({
        workspaceDomain,
        nanoid: deleting.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Tier deleted." });
        setDeleting(null);
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the tier.",
        });
      }
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage tiers</DialogTitle>
            <DialogDescription>
              Rename a tier or remove it. A company that still points at a
              deleted tier simply has no tier.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {tiers.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No tiers yet. Create one with the &ldquo;Add Tier&rdquo; button.
              </p>
            ) : (
              tiers.map((tier) => (
                <div
                  key={tier.nanoid}
                  className="flex items-center gap-3 rounded-xl border px-3 py-2"
                >
                  {editing?.nanoid === tier.nanoid ? (
                    <>
                      <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        aria-label="Tier label"
                        className="h-8 w-20"
                      />
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        aria-label="Tier title"
                        className="h-8 flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={saveEdit}
                        disabled={pending}
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditing(null)}
                        disabled={pending}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="w-8 shrink-0 rounded-md bg-primary/10 px-2 py-1 text-center text-xs font-semibold text-primary">
                        {tier.label}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {tier.title}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(tier)}
                        aria-label={`Rename tier ${tier.title}`}
                      >
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleting(tier)}
                        aria-label={`Delete tier ${tier.title}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(next) => {
          if (!next) setDeleting(null);
        }}
        title="Delete tier?"
        description={
          deleting
            ? `“${deleting.title}” will no longer be available as a company tier.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
