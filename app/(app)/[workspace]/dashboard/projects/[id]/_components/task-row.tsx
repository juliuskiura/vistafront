"use client";

import Link from "next/link";
import { useState } from "react";

import type { Task } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { Edit3, MoreVertical, Trash2 } from "@/lib/icons";
import {
  PROJECT_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTaskStatusAction } from "../../actions/task-actions";

interface Props {
  task: Task;
  selected: boolean;
  onToggleSelect: (nanoid: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  workspaceDomain: string;
}

/**
 * One task in the tasks tab.
 *
 * The status control steps `todo → in progress → done` and back, which is
 * what the old app's status select did. Completing a task is a plain
 * status PATCH — the backend has no `complete` action on the task viewset
 * — and it makes the viewset recompute the parent deliverable, so a
 * deliverable whose last task is done publishes itself.
 */
export function TaskRow({
  task,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  workspaceDomain,
}: Props) {
  const [status, setStatus] = useState(task.status);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(next: string) {
    const previous = status;
    setStatus(next as Task["status"]);
    setPending(true);
    setError(null);

    const result = await updateTaskStatusAction({
      workspaceDomain,
      nanoid: task.nanoid,
      status: next,
    });

    setPending(false);
    if (result.status === "error") {
      setStatus(previous);
      setError(result.message ?? "The status could not be changed.");
    }
  }

  return (
    <div
      className={`px-4 py-3 ${
        selected ? "bg-primary/5 ring-1 ring-primary/30" : ""
      }`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(task.nanoid)}
            aria-label={`Select ${task.title}`}
            className="mt-1 size-4 shrink-0 rounded border-input"
          />
          <div className="min-w-0">
            <Link
              href={`/${workspaceDomain}/dashboard/projects/tasks/${task.nanoid}`}
              className={`block truncate text-sm font-medium hover:underline ${
                task.status === "done" ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </Link>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {task.deliverable_title ?? "No deliverable"}
              {task.assignee_name ? ` · ${task.assignee_name}` : " · Unassigned"}
              {task.due_date ? ` · due ${formatMediumDate(task.due_date)}` : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-7 lg:shrink-0 lg:pl-0">
          <label htmlFor={`task-status-${task.nanoid}`} className="sr-only">
            Status for {task.title}
          </label>
          <select
            id={`task-status-${task.nanoid}`}
            value={status}
            disabled={pending}
            onChange={(event) => handleStatusChange(event.target.value)}
            className={`h-8 rounded-lg border px-2 text-xs font-medium shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 ${statusBadgeClass(
              status,
            )}`}
          >
            {(["todo", "in_progress", "done"] as const).map((value) => (
              <option key={value} value={value}>
                {TASK_STATUS_LABELS[value]}
              </option>
            ))}
          </select>

          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
              priorityBadgeClass(task.priority)
            }`}
          >
            {PROJECT_PRIORITY_LABELS[task.priority]}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-9 p-0"
                aria-label={`Actions for ${task.title}`}
              >
                <MoreVertical className="size-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(task)}>
                <Edit3 className="size-4" aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(task)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
