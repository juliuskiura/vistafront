"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Pencil, Trash2, X } from "@/lib/icons";
import type { Deal, PipelineStage } from "@/lib/api";
import { useToast } from "@/lib/context";
import {
  deleteDealAction,
  updateDealAction,
} from "@/app/(app)/[workspace]/dashboard/pipeline/deal-actions";
import { MoveStageMenu } from "./move-stage-menu";

interface Props {
  deal: Deal;
  stages: PipelineStage[];
  workspaceDomain: string;
}

/**
 * The deal's actions: edit the fields, move the stage, mark it won or
 * lost, and delete it.
 */
export function DealDetailActions({ deal, stages, workspaceDomain }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(deal.value ? String(deal.value) : "");
  const [notes, setNotes] = useState(deal.notes ?? "");

  const save = () => {
    startTransition(async () => {
      const result = await updateDealAction({
        workspaceDomain,
        nanoid: deal.nanoid,
        title,
        value: value ? Number(value) : undefined,
        notes,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Deal updated." });
        setEditing(false);
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not update the deal.",
        });
      }
    });
  };

  const setStatus = (status: "won" | "lost") => {
    startTransition(async () => {
      const result = await updateDealAction({
        workspaceDomain,
        nanoid: deal.nanoid,
        title: deal.title,
        status,
      });
      if (result.status === "success") {
        toast.push({
          variant: "success",
          message: status === "won" ? "Deal marked won." : "Deal marked lost.",
        });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not update the deal.",
        });
      }
    });
  };

  const confirmDelete = () => {
    startTransition(async () => {
      const result = await deleteDealAction({
        workspaceDomain,
        nanoid: deal.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Deal deleted." });
        router.push(`/${workspaceDomain}/dashboard/deals`);
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the deal.",
        });
        setDeleteOpen(false);
      }
    });
  };

  if (editing) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-4">
        <div className="space-y-1.5">
          <Label htmlFor="deal-edit-title">Title</Label>
          <Input
            id="deal-edit-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-edit-value">Value</Label>
          <Input
            id="deal-edit-value"
            type="number"
            min={0}
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deal-edit-notes">Notes</Label>
          <textarea
            id="deal-edit-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setTitle(deal.title);
              setValue(deal.value ? String(deal.value) : "");
              setNotes(deal.notes ?? "");
            }}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setEditing(true)}
        >
          <Pencil className="mr-1.5 size-3.5" aria-hidden="true" />
          Edit
        </Button>
        <MoveStageMenu
          dealNanoid={deal.nanoid}
          dealTitle={deal.title}
          currentStage={deal.stage}
          stages={stages}
          workspaceDomain={workspaceDomain}
        />
        {deal.status === "open" ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStatus("won")}
              disabled={pending}
            >
              <Check className="mr-1.5 size-3.5" aria-hidden="true" />
              Mark won
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setStatus("lost")}
              disabled={pending}
            >
              <X className="mr-1.5 size-3.5" aria-hidden="true" />
              Mark lost
            </Button>
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setDeleteOpen(true)}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
          Delete
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete deal?"
        description={`“${deal.title}” will be permanently removed.`}
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
