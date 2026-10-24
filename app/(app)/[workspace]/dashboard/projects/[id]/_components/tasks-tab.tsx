"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import type { Task } from "@/lib/api";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  X,
  Layers,
  MoreVertical,
  Edit3,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MergeDialog } from "../../_components/merge-dialog";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import { deleteTaskAction, deleteTasksAction } from "../../actions/task-actions";
import { updateTaskStatusAction } from "../../actions/task-actions";
import { formatMediumDate } from "@/lib/dates";
import {
  nextTaskStatus,
  statusBadgeClass,
  TASK_STATUS_LABELS,
} from "@/lib/projects/constants";

interface Props {
  workspaceDomain: string;
  tasks: Task[];
  members: PickerOption[];
  projectOptions: PickerOption[];
}

/**
 * The tasks tab as a parent → subtask matrix.
 *
 * Tasks with no `parent` are shown as rows; tasks with a `parent` are
 * nested underneath their parent as subtasks. Each subtask has a done /
 * not-done toggle, and the parent's status rolls up from its subtasks:
 * all done → parent done; any open → parent in progress.
 */
export function TasksTab({
  workspaceDomain,
  tasks,
  members,
  projectOptions,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [expandedParents, setExpandedParents] = useState<Set<string>>(
    new Set(),
  );

  const parentTasks = useMemo(
    () => tasks.filter((task) => !task.parent),
    [tasks],
  );

  const childrenByParent = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (task.parent) {
        const siblings = map.get(task.parent) ?? [];
        siblings.push(task);
        map.set(task.parent, siblings);
      }
    }
    return map;
  }, [tasks]);

  const selectedTasks = tasks.filter((task) => selected.has(task.nanoid));

  function toggle(nanoid: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(nanoid)) next.delete(nanoid);
      else next.add(nanoid);
      return next;
    });
  }

  function toggleParent(nanoid: string) {
    setExpandedParents((current) => {
      const next = new Set(current);
      if (next.has(nanoid)) next.delete(nanoid);
      else next.add(nanoid);
      return next;
    });
  }

  function onEdit(task: Task) {
    setEditTarget(task);
  }

  function onDelete(task: Task) {
    setDeleteTarget(task);
  }

  async function toggleSubtask(nanoid: string, currentStatus: string) {
    const next = nextTaskStatus(currentStatus as Task["status"]);
    try {
      const result = await updateTaskStatusAction({
        workspaceDomain,
        nanoid,
        status: next,
      });
      if (result.status === "error") {
        setActionError(result.message ?? "The status could not be changed.");
      }
    } catch {
      setActionError("The status could not be changed.");
    }
  }

  const handleStatusChange = useCallback(
    async (nanoid: string, status: string) => {
      try {
        const result = await updateTaskStatusAction({
          workspaceDomain,
          nanoid,
          status,
        });
        if (result.status === "error") {
          setActionError(result.message ?? "The status could not be changed.");
        }
      } catch {
        setActionError("The status could not be changed.");
      }
    },
    [workspaceDomain],
  );

  return (    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Tasks ({tasks.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            Parent tasks with their subtasks nested underneath.
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
          {parentTasks.map((parent) => {
            const children = childrenByParent.get(parent.nanoid) ?? [];
            const isExpanded = expandedParents.has(parent.nanoid);
            const allChildrenDone =
              children.length > 0 && children.every((c) => c.status === "done");
            const anyChildOpen = children.some((c) => c.status !== "done");

            return (
              <div key={parent.nanoid} className="px-4 py-3">
                <div
                  onClick={() => toggleParent(parent.nanoid)}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleParent(parent.nanoid);
                    }
                  }}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(parent.nanoid)}
                        onChange={() => toggle(parent.nanoid)}
                        aria-label={`Select ${parent.title}`}
                        className="mt-1 size-4 shrink-0 rounded border-input"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="size-3 text-muted-foreground">
                            {isExpanded ? (
                              <ChevronDown className="size-3" aria-hidden="true" />
                            ) : (
                              <ChevronRight className="size-3" aria-hidden="true" />
                            )}
                          </span>
                          <Link
                            href={`/${workspaceDomain}/dashboard/projects/tasks/${parent.nanoid}`}
                            className={`block truncate text-sm font-medium hover:underline ${
                              parent.status === "done"
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {parent.title}
                          </Link>
                          {children.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {children.length} subtask{children.length === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {parent.project_name ?? "No project"}
                          {parent.assignee_name ? ` · ${parent.assignee_name}` : " · Unassigned"}
                          {parent.due_date ? ` · due ${formatMediumDate(parent.due_date)}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pl-7 lg:shrink-0 lg:pl-0">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          statusBadgeClass(parent.status)
                        }`}
                      >
                        {TASK_STATUS_LABELS[parent.status]}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-9 p-0"
                            aria-label={`Actions for ${parent.title}`}
                          >
                            <MoreVertical className="size-4" aria-hidden="true" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(parent)}>
                            <Edit3 className="size-4" aria-hidden="true" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => onDelete(parent)}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {isExpanded && children.length > 0 && (
                  <div className="pl-10 mt-2 border-l-2 border-muted/30">
                    {children.map((child) => (
                      <div
                        key={child.nanoid}
                        className="px-2 py-2 rounded-lg border border-transparent hover:bg-muted/50"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={child.status === "done"}
                            onChange={() => toggleSubtask(child.nanoid, child.status)}
                            className="size-4 shrink-0 rounded border-input"
                            aria-label={`Mark ${child.title} ${child.status === "done" ? "not done" : "done"}`}
                          />
                          <span
                            className={`text-sm truncate ${
                              child.status === "done"
                                ? "line-through text-muted-foreground"
                                : "text-foreground"
                            }`}
                          >
                            {child.title}
                          </span>
                          {child.due_date && (
                            <span className="ml-auto text-xs text-muted-foreground">
                              {formatMediumDate(child.due_date)}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-6 p-0 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTarget(child)}
                            aria-label={`Delete ${child.title}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {allChildrenDone && (
                      <p className="text-xs text-success mt-1">
                        All subtasks complete — parent rolls to Done.
                      </p>
                    )}
                    {anyChildOpen && !allChildrenDone && children.length > 0 && (
                      <p className="text-xs text-warning mt-1">
                        Open subtasks — parent stays In Progress.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add task</DialogTitle>
            <DialogDescription>
              A task belongs to this project.
            </DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            projects={projectOptions}
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
              projects={projectOptions}
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
