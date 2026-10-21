"use client";

import { useActionState, useEffect, useState } from "react";

import type { Deliverable } from "@/lib/api";
import { Check, Send, Undo2, Upload } from "@/lib/icons";
import { deliverableWorkflowActions } from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelDeliverableAction } from "../actions/deliverable-actions";
import {
  approveDeliverableAction,
  publishDeliverableAction,
  requestRevisionsAction,
  submitReviewAction,
} from "../actions/workflow-actions";
import { initialProjectActionState } from "../action-state";

interface Props {
  deliverable: Deliverable;
  workspaceDomain: string;
  /** The deliverable type, for the status PATCH that cancels one. */
  deliverableType?: string | null;
  className?: string;
}

/**
 * The publish workflow.
 *
 * The backend's actions are one-way steps up a ladder — `draft` → `review`
 * → `approved` → `published` — with `revisions` as the loop back. The
 * button set therefore follows from the deliverable's current status and
 * nothing else, and a deliverable that has been published offers no
 * further action.
 */
export function ReviewPanel({
  deliverable,
  workspaceDomain,
  className,
}: Props) {
  const [notesOpen, setNotesOpen] = useState<"approve" | "revisions" | null>(
    null,
  );
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const actions = deliverableWorkflowActions(deliverable.status);

  async function run(action: "submit_review" | "publish") {
    setError(null);
    const result =
      action === "submit_review"
        ? await submitReviewAction({
            workspaceDomain,
            nanoid: deliverable.nanoid,
          })
        : await publishDeliverableAction({
            workspaceDomain,
            nanoid: deliverable.nanoid,
          });
    if (result.status === "error") {
      setError(result.message ?? "That step did not go through.");
    }
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-2">
        {actions.includes("submit_review") ? (
          <Button
            size="sm"
            onClick={() => run("submit_review")}
            variant={deliverable.status === "revisions" ? "secondary" : "default"}
          >
            <Send className="size-4" aria-hidden="true" />
            {deliverable.status === "revisions"
              ? "Resubmit for review"
              : "Submit for review"}
          </Button>
        ) : null}

        {actions.includes("approve") ? (
          <Button size="sm" onClick={() => setNotesOpen("approve")}>
            <Check className="size-4" aria-hidden="true" />
            Approve
          </Button>
        ) : null}

        {actions.includes("request_revisions") ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setNotesOpen("revisions")}
          >
            <Undo2 className="size-4" aria-hidden="true" />
            Request revisions
          </Button>
        ) : null}

        {actions.includes("publish") ? (
          <Button size="sm" onClick={() => run("publish")}>
            <Upload className="size-4" aria-hidden="true" />
            Publish
          </Button>
        ) : null}

        {deliverable.status === "draft" ||
        deliverable.status === "revisions" ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setCancelOpen(true)}
          >
            Cancel deliverable
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <ReviewNotesDialog
        mode={notesOpen}
        deliverable={deliverable}
        workspaceDomain={workspaceDomain}
        onClose={() => setNotesOpen(null)}
      />

      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this deliverable?"
        description={`“${deliverable.title}” will be marked as cancelled. Its tasks are kept.`}
        confirmLabel="Cancel deliverable"
        variant="destructive"
        onConfirm={async () => {
          const result = await cancelDeliverableAction({
            workspaceDomain,
            nanoid: deliverable.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The deliverable could not be cancelled.");
          }
        }}
      />
    </div>
  );
}

/**
 * The approve / request-revisions dialog.
 *
 * Both steps write `review_notes` onto the deliverable. Approving may be
 * done without a note; asking for revisions may not — saying what has to
 * change is the whole point of the step.
 */
function ReviewNotesDialog({
  mode,
  deliverable,
  workspaceDomain,
  onClose,
}: {
  mode: "approve" | "revisions" | null;
  deliverable: Deliverable;
  workspaceDomain: string;
  onClose: () => void;
}) {
  const action = mode === "revisions" ? requestRevisionsAction : approveDeliverableAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialProjectActionState,
  );

  useEffect(() => {
    if (state.status === "success") onClose();
  }, [state, onClose]);

  return (
    <Dialog open={mode !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "revisions" ? "Request revisions" : "Approve deliverable"}
          </DialogTitle>
          <DialogDescription>
            {mode === "revisions"
              ? "Tell the author what has to change. The note is stored on the deliverable."
              : "The note is optional and is stored on the deliverable next to your name."}
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="workspace_domain" value={workspaceDomain} />
          <input type="hidden" name="nanoid" value={deliverable.nanoid} />

          <div className="space-y-1.5">
            <Label htmlFor="review_notes">
              {mode === "revisions" ? "What needs to change" : "Review notes"}
            </Label>
            <Textarea
              id="review_notes"
              name="review_notes"
              rows={4}
              required={mode === "revisions"}
              placeholder={
                mode === "revisions"
                  ? "The headline does not match the brief…"
                  : "Looks good."
              }
            />
          </div>

          {state.status === "error" && state.message ? (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.message}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : mode === "revisions"
                  ? "Request revisions"
                  : "Approve"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
