"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Attachment, Comment, Task } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { Edit3, Trash2 } from "@/lib/icons";
import {
  PROJECT_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  priorityBadgeClass,
  statusBadgeClass,
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
import { RichText } from "../../_components/rich-text";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import { deleteTaskAction } from "../../actions/task-actions";
import { TaskAttachments } from "./_components/task-attachments";
import { TaskComments } from "./_components/task-comments";

interface Props {
  task: Task;
  workspaceDomain: string;
  comments: Comment[];
  attachments: Attachment[];
  members: PickerOption[];
  deliverables: PickerOption[];
}

/**
 * The task record.
 *
 * Everything about one task: its fields, the conversation about it, and
 * the files attached to it. The old app had comments and attachments on
 * this page; they are back.
 */
export function TaskRecord({
  task,
  workspaceDomain,
  comments,
  attachments,
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
        <h2 className="sr-only">{task.title}</h2>

        <Link
          href={`/${workspaceDomain}/dashboard/projects`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Projects
        </Link>
        {task.project ? (
          <>
            <span className="text-muted-foreground/50" aria-hidden="true">
              /
            </span>
            <Link
              href={`/${workspaceDomain}/dashboard/projects/${task.project}?tab=tasks`}
              className="text-sm text-muted-foreground hover:underline"
            >
              {task.project_name}
            </Link>
          </>
        ) : null}

        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            statusBadgeClass(task.status)
          }`}
        >
          {TASK_STATUS_LABELS[task.status]}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            priorityBadgeClass(task.priority)
          }`}
        >
          {PROJECT_PRIORITY_LABELS[task.priority]}
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

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Deliverable</p>
          {task.deliverable ? (
            <Link
              href={`/${workspaceDomain}/dashboard/deliverables/${task.deliverable}`}
              className="mt-1 block text-sm font-medium hover:underline"
            >
              {task.deliverable_title ?? "Open deliverable"}
            </Link>
          ) : (
            <p className="mt-1 text-sm font-medium">No deliverable</p>
          )}
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Assignee</p>
          <p className="mt-1 text-sm font-medium">
            {task.assignee_name ?? "Unassigned"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Due date</p>
          <p className="mt-1 text-sm font-medium">
            {formatMediumDate(task.due_date)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Created</p>
          <p className="mt-1 text-sm font-medium">
            {formatMediumDate(task.created_at)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Description
        </h3>
        {task.description ? (
          <RichText html={task.description} className="mt-3" />
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No description yet.
          </p>
        )}
      </div>

      <TaskComments
        targetNanoid={task.nanoid}
        comments={comments}
        workspaceDomain={workspaceDomain}
      />

      <TaskAttachments
        targetNanoid={task.nanoid}
        attachments={attachments}
        workspaceDomain={workspaceDomain}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the details of this task.</DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            task={task}
            deliverables={deliverables}
            members={members}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this task?"
        description={`“${task.title}” will be deleted. This cannot be undone.`}
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteTaskAction({
            workspaceDomain,
            nanoid: task.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The task could not be deleted.");
            return;
          }
          router.push(
            task.project
              ? `/${workspaceDomain}/dashboard/projects/${task.project}?tab=tasks`
              : `/${workspaceDomain}/dashboard/projects`,
          );
        }}
      />
    </div>
  );
}
