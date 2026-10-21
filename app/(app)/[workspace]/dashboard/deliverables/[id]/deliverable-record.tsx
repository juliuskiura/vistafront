"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Comment, Deliverable } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { Edit3, Trash2 } from "@/lib/icons";
import {
  DELIVERABLE_STATUS_LABELS,
  deliverableStatusBadgeClass,
  deliverableTypeLabel,
} from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RichText } from "../../projects/_components/rich-text";
import { ReviewPanel } from "../../projects/_components/review-panel";
import { DeliverableForm } from "../../projects/forms/deliverable-form";
import type { PickerOption } from "../../projects/forms/project-form";
import {
  deleteDeliverableAction,
} from "../../projects/actions/deliverable-actions";
import { DeliverableComments } from "./_components/deliverable-comments";
import { DeliverableTasks } from "./_components/deliverable-tasks";

interface Props {
  deliverable: Deliverable;
  workspaceDomain: string;
  comments: Comment[];
  members: PickerOption[];
  deliverables: PickerOption[];
}

/**
 * The deliverable record.
 *
 * The old app's deliverable page had a full publish workflow, a task
 * list, comments and attachments. The workflow, the tasks and the
 * comments are back here; the page is the place where a deliverable's
 * review state is decided.
 */
export function DeliverableRecord({
  deliverable,
  workspaceDomain,
  comments,
  members,
  deliverables,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="sr-only">{deliverable.title}</h2>

        <Link
          href={`/${workspaceDomain}/dashboard/projects`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Projects
        </Link>
        {deliverable.project ? (
          <>
            <span className="text-muted-foreground/50" aria-hidden="true">
              /
            </span>
            <Link
              href={`/${workspaceDomain}/dashboard/projects/${deliverable.project}?tab=deliverables`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {deliverable.project_name}
            </Link>
          </>
        ) : null}

        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            deliverableStatusBadgeClass(deliverable.status)
          }`}
        >
          {DELIVERABLE_STATUS_LABELS[deliverable.status]}
        </span>
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {deliverableTypeLabel(deliverable.deliverable_type)}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Edit3 className="size-4" aria-hidden="true" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Assigned to</p>
          <p className="mt-1 text-sm font-medium">
            {deliverable.assigned_to_name ?? "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Due date</p>
          <p className="mt-1 text-sm font-medium">
            {formatMediumDate(deliverable.due_date)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Created</p>
          <p className="mt-1 text-sm font-medium">
            {formatMediumDate(deliverable.created_at)}
          </p>
        </div>
      </div>

      {deliverable.review_notes ? (
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Review notes
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm">
            {deliverable.review_notes}
          </p>
        </div>
      ) : null}

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        {deliverable.description ? (
          <RichText html={deliverable.description} className="mt-3" />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No description yet.
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Workflow
        </h3>
        <ReviewPanel
          deliverable={deliverable}
          workspaceDomain={workspaceDomain}
        />
      </div>

      <DeliverableTasks
        deliverable={deliverable}
        tasks={deliverable.tasks ?? []}
        members={members}
        deliverables={deliverables}
        workspaceDomain={workspaceDomain}
      />

      <DeliverableComments
        targetNanoid={deliverable.nanoid}
        comments={comments}
        workspaceDomain={workspaceDomain}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit deliverable</DialogTitle>
            <DialogDescription>
              Update the details of this deliverable.
            </DialogDescription>
          </DialogHeader>
          <DeliverableForm
            workspaceDomain={workspaceDomain}
            projectNanoid={deliverable.project}
            deliverable={deliverable}
            members={members}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this deliverable?"
        description={`“${deliverable.title}” and its tasks will be deleted. This cannot be undone.`}
        confirmLabel="Delete deliverable"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteDeliverableAction({
            workspaceDomain,
            nanoid: deliverable.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The deliverable could not be deleted.");
            return;
          }
          router.push(
            deliverable.project
              ? `/${workspaceDomain}/dashboard/projects/${deliverable.project}?tab=deliverables`
              : `/${workspaceDomain}/dashboard/projects`,
          );
        }}
      />
    </div>
  );
}
