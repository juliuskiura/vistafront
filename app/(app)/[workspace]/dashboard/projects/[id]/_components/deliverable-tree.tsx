"use client";

import Link from "next/link";

import type { Task } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Edit3,
  MoreVertical,
  Plus,
  Trash2,
} from "@/lib/icons";
import {
  TASK_STATUS_LABELS,
  deliverableStatusBadgeClass,
  deliverableTypeLabel,
  statusBadgeClass,
} from "@/lib/projects/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DeliverableRow } from "../../record-types";

interface Props {
  rows: DeliverableRow[];
  /** Every task in the project, matched to a deliverable by nanoid. */
  tasks: Task[];
  selected: Set<string>;
  expanded: Set<string>;
  onToggleSelect: (nanoid: string) => void;
  onToggleExpand: (nanoid: string) => void;
  onEdit: (row: DeliverableRow) => void;
  onDelete: (row: DeliverableRow) => void;
  onAddTask: (row: DeliverableRow) => void;
  workspaceDomain: string;
}

/**
 * The deliverable tree.
 *
 * One expandable row per deliverable, with its tasks nested underneath.
 * The rows are ordered by the backend's own `order` field — the models are
 * `OrderedModel`s — so the tree matches the order the server keeps them
 * in, not the order they were created.
 */
export function DeliverableTree({
  rows,
  tasks,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddTask,
  workspaceDomain,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No deliverables yet. Add one to track what this project delivers.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const deliverableTasks = tasks.filter(
          (task) => task.project === row.summary.nanoid,
        );
        const done = deliverableTasks.filter(
          (task) => task.status === "done",
        ).length;
        const percentage =
          deliverableTasks.length > 0
            ? Math.round((done / deliverableTasks.length) * 100)
            : row.summary.status === "published"
              ? 100
              : 0;
        const isExpanded = expanded.has(row.summary.nanoid);
        const isSelected = selected.has(row.summary.nanoid);

        return (
          <div
            key={row.summary.nanoid}
            className={`overflow-hidden rounded-xl border bg-card ${
              isSelected ? "ring-2 ring-primary/40" : ""
            }`}
          >
            <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(row.summary.nanoid)}
                  aria-label={`Select ${row.summary.title}`}
                  className="mt-1 size-4 shrink-0 rounded border-input"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleExpand(row.summary.nanoid)}
                  aria-label={
                    isExpanded
                      ? `Collapse ${row.summary.title}`
                      : `Expand ${row.summary.title}`
                  }
                  aria-expanded={isExpanded}
                  className="size-9 shrink-0 p-0"
                >
                  {isExpanded ? (
                    <ChevronDown className="size-4" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="size-4" aria-hidden="true" />
                  )}
                </Button>
                <div className="min-w-0">
                  <Link
                    href={`/${workspaceDomain}/dashboard/deliverables/${row.summary.nanoid}`}
                    className="truncate text-sm font-medium hover:underline"
                  >
                    {row.summary.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{deliverableTypeLabel(row.summary.deliverable_type)}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                      {deliverableTasks.length} task
                      {deliverableTasks.length === 1 ? "" : "s"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Due {formatMediumDate(row.summary.due_date)}</span>
                    {row.detail?.assigned_to_name ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{row.detail.assigned_to_name}</span>
                      </>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:shrink-0">
                <div className="w-28">
                  <Progress value={percentage} className="h-1.5" />
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {done}/{deliverableTasks.length}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    deliverableStatusBadgeClass(row.summary.status)
                  }`}
                >
                  {row.summary.status.replace("_", " ")}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-9 p-0"
                      aria-label={`Actions for ${row.summary.title}`}
                    >
                      <MoreVertical className="size-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onAddTask(row)}>
                      <Plus className="size-4" aria-hidden="true" />
                      Add task
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(row)}>
                      <Edit3 className="size-4" aria-hidden="true" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(row)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {isExpanded ? (
              <div className="space-y-2 border-t bg-muted/20 p-4">
                {deliverableTasks.length === 0 ? (
                  <p className="py-4 text-center text-xs uppercase tracking-wide text-muted-foreground">
                    No tasks in this deliverable
                  </p>
                ) : (
                  deliverableTasks.map((task) => (
                    <div
                      key={task.nanoid}
                      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-3 py-2"
                    >
                      <Link
                        href={`/${workspaceDomain}/dashboard/projects/tasks/${task.nanoid}`}
                        className="min-w-0 truncate text-sm hover:underline"
                      >
                        {task.title}
                      </Link>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant="outline"
                          className={statusBadgeClass(task.status)}
                        >
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
