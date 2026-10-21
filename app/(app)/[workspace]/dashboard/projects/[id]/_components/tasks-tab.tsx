"use client";

import { useState } from "react";

import type { Task } from "@/lib/api";
import { Layers, Plus, Trash2, X } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MergeDialog } from "../../_components/merge-dialog";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import { deleteTaskAction, deleteTasksAction } from "../../actions/task-actions";
import { TaskRow } from "./task-row";

interface Props {
  workspaceDomain: string;
  tasks: Task[];
  members: PickerOption[];
  deliverableOptions: PickerOption[];
}

/**
 * The tasks tab.
 *
 * A flat list of the project's tasks, with the bulk actions the old app
 * had: pick several and merge them into one, or delete them together.
 */
export function TasksTab({
  workspaceDomain,
  tasks,
  members,
  deliverableOptions,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  function toggle(nanoid: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(nanoid)) next.delete(nanoid);
      else next.add(nanoid);
      return next;
    });
  }

  const selectedTasks = tasks.filter((task) => selected.has(task.nanoid));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tasks ({tasks.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Every task in this project, across all of its deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selected.size === 0 ? (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" aria-hidden="true" />
              Add task
            </Button>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-2 py-1">
              <span className="px-1 text-xs font-medium uppercase tracking-wide text-primary">
                {selected.size} selected
              </span>
              {selected.size >= 2 ? (
                <Button size="sm" variant="ghost" onClick={() => setMergeOpen(true)}>
                  <Layers className="size-4" aria-hidden="true" />
                  Merge
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(new Set())}
                aria-label="Clear selection"
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      {tasks.length === 0 ? (
        <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          No tasks yet. Add one to break this project down.
        </p>
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {tasks.map((task) => (
            <TaskRow
              key={task.nanoid}
              task={task}
              selected={selected.has(task.nanoid)}
              onToggleSelect={toggle}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              workspaceDomain={workspaceDomain}
            />
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
            <DialogDescription>
              A task hangs off a deliverable — that is how it belongs to this
              project.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            deliverables={deliverableOptions}
            members={members}
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
              deliverables={deliverableOptions}
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
            setActionError(result.message ?? "The task could not be deleted.");
          }
        }}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={`Delete ${selected.size} task${selected.size === 1 ? "" : "s"}?`}
        description={
          <div className="space-y-2">
            <p>The selected tasks will be deleted. This cannot be undone.</p>
            <ul className="space-y-1 rounded-md bg-muted/40 p-2">
              {selectedTasks.map((task) => (
                <li key={task.nanoid} className="truncate text-xs">
                  • {task.title}
                </li>
              ))}
            </ul>
          </div>
        }
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteTasksAction({
            workspaceDomain,
            nanoids: selectedTasks.map((task) => task.nanoid),
          });
          if (result.status === "error") {
            setActionError(result.message ?? "The tasks could not be deleted.");
          } else {
            setSelected(new Set());
          }
        }}
      />

      <MergeDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        kind="task"
        workspaceDomain={workspaceDomain}
        selected={selectedTasks.map((task) => ({
          nanoid: task.nanoid,
          title: task.title,
        }))}
        onMerged={() => setSelected(new Set())}
      />
    </div>
  );
}
