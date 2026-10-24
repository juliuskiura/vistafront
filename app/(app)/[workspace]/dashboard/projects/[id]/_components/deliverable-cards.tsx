"use client";

import Link from "next/link";

import type { Task } from "@/lib/api";
import { formatMediumDate, formatMonth } from "@/lib/dates";
import { Edit3, Trash2 } from "@/lib/icons";
import { deliverableTypeLabel } from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ReviewPanel } from "../../_components/review-panel";
import type { DeliverableRow } from "../../record-types";

interface Props {
  rows: DeliverableRow[];
  /** Every task in the project, matched to a deliverable by nanoid. */
  tasks: Task[];
  selected: Set<string>;
  onToggleSelect: (nanoid: string) => void;
  onEdit: (row: DeliverableRow) => void;
  onDelete: (row: DeliverableRow) => void;
  workspaceDomain: string;
}

interface Group {
  /** The `YYYY-MM` bucket, or `null` for deliverables with no due date. */
  key: string | null;
  label: string;
  rows: DeliverableRow[];
}

/**
 * The deliverable card grid.
 *
 * The old app's "calendar" was not a calendar: it read the week and the
 * platform out of the deliverable's **title** with a regular expression
 * (`W1 Mon (Instagram): topic`), so a deliverable named anything else
 * simply vanished from the grid. This grid groups by the deliverable's
 * real `due_date` instead, and the old week filter becomes a month filter.
 */
export function DeliverableCards({
  rows,
  tasks,
  selected,
  onToggleSelect,
  onEdit,
  onDelete,
  workspaceDomain,
}: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
        No deliverables yet. Add one to track what this project delivers.
      </p>
    );
  }

  const groups = groupByMonth(rows);

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.key ?? "no-due-date"} className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
            <span className="ml-2 text-xs font-normal normal-case">
              {group.rows.length} deliverable
              {group.rows.length === 1 ? "" : "s"}
            </span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.rows.map((row) => {
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
              const isSelected = selected.has(row.summary.nanoid);

              return (
                <article
                  key={row.summary.nanoid}
                  className={`flex flex-col gap-3 rounded-xl border bg-card p-4 ${
                    isSelected ? "ring-2 ring-primary/40" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(row.summary.nanoid)}
                      aria-label={`Select ${row.summary.title}`}
                      className="mt-1 size-4 shrink-0 rounded border-input"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/${workspaceDomain}/dashboard/deliverables/${row.summary.nanoid}`}
                        className="block truncate text-sm font-medium hover:underline"
                      >
                        {row.summary.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {deliverableTypeLabel(row.summary.deliverable_type)}
                        {row.detail?.assigned_to_name
                          ? ` · ${row.detail.assigned_to_name}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        Due {formatMediumDate(row.summary.due_date)}
                      </span>
                      <span className="font-medium tabular-nums">
                        {done}/{deliverableTasks.length}
                      </span>
                    </div>
                    <Progress value={percentage} className="h-1.5" />
                  </div>

                  {row.detail ? (
                    <ReviewPanel
                      deliverable={row.detail}
                      workspaceDomain={workspaceDomain}
                      className="mt-auto"
                    />
                  ) : null}

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(row)}
                    >
                      <Edit3 className="size-4" aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(row)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Group the deliverables by the month they are due in.
 *
 * Within a group the rows keep the backend's own `order`, so the grid
 * reads in the same sequence as the tree. Deliverables with no due date
 * collect in a group of their own rather than being dropped.
 */
function groupByMonth(rows: DeliverableRow[]): Group[] {
  const buckets = new Map<string | null, DeliverableRow[]>();

  for (const row of rows) {
    const key = row.summary.due_date ? row.summary.due_date.slice(0, 7) : null;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(row);
    else buckets.set(key, [row]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a.localeCompare(b);
    })
    .map(([key, bucket]) => ({
      key,
      label: key ? formatMonth(`${key}-01`) : "No due date",
      rows: bucket,
    }));
}
