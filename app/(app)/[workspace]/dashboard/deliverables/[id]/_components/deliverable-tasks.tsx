"use client";

import Link from "next/link";
import { useState } from "react";

import type { Deliverable, Task } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { Edit3, Plus, Trash2 } from "@/lib/icons";
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
import { TaskForm } from "../../../projects/forms/task-form";
import type { PickerOption } from "../../../projects/forms/project-form";
import { deleteTaskAction } from "../../../projects/actions/task-actions";

interface Props {
  deliverable: Deliverable;
  tasks: Task[];
  members: PickerOption[];
  deliverables: PickerOption[];
  workspaceDomain: string;
}

/**
 * The tasks that belong to one deliverable.
 *
 * A task reaches a project through its deliverable, so this list is where
 * a deliverable's work actually lives.
 */
export function DeliverableTasks({
  deliverable,
  tasks,
  members,
  deliverables,
  workspaceDomain,
}: Props) {
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tasks ({tasks.length})
        </h2>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="size-4" aria-hidden="true" />
          Add task
        </Button>
      </div>

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tasks on this deliverable yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {tasks.map((task) => (
            <li
              key={task.nanoid}
              className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <Link
                  href={`/${workspaceDomain}/dashboard/projects/tasks/${task.nanoid}`}
                  className={`block truncate text-sm font-medium hover:underline ${
                    task.status === "done"
                      ? "line-through text-muted-foreground"
                      : ""
                  }`}
                >
                  {task.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {task.assignee_name ?? "Unassigned"}
                  {task.due_date ? ` · due ${formatMediumDate(task.due_date)}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0"
                  onClick={() => setEditTarget(task)}
                  aria-label={`Edit ${task.title}`}
                >
                  <Edit3 className="size-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-8 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(task)}
                  aria-label={`Delete ${task.title}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
            <DialogDescription>
              A task on “{deliverable.title}”.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            deliverables={deliverables}
            members={members}
            defaultDeliverable={deliverable.nanoid}
            submitLabel="Add task"
            onSuccess={() => setAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={editTarget !== null}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the details of this task.</DialogDescription>
          </DialogHeader>
          {editTarget ? (
            <TaskForm
              workspaceDomain={workspaceDomain}
              task={editTarget}
              deliverables={deliverables}
              members={members}
              submitLabel="Save changes"
              onSuccess={() => setEditTarget(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this task?"
        description={`“${deleteTarget?.title}” will be deleted. This cannot be undone.`}
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteTaskAction({
            workspaceDomain,
            nanoid: deleteTarget.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The task could not be deleted.");
          }
        }}
      />
    </div>
  );
}
