"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProjectSummary } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { Trash2 } from "@/lib/icons";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/projects/constants";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ProgressMeter } from "./project-progress";
import { deleteProjectAction } from "../actions/project-actions";

interface Props {
  projects: ProjectSummary[];
  workspaceDomain: string;
}

/**
 * The project list table.
 *
 * Each row carries both progress bars — the backend counts a project's
 * finished tasks and published deliverables, so the numbers need no
 * client-side tally.
 */
export function ProjectsTable({ projects, workspaceDomain }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <p className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        No projects match. Try clearing the filters, or create a project to
        get started.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="hidden grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_repeat(2,minmax(0,1fr)_minmax(0,1.2fr)_auto] gap-4 border-b bg-muted/30 px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground lg:grid">
          <span>Project</span>
          <span>Company</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Progress</span>
          <span className="w-10" />
        </div>

        <ul className="divide-y">
          {projects.map((project) => (
            <li
              key={project.nanoid}
              className="grid gap-3 px-4 py-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_repeat(2,minmax(0,1fr)_minmax(0,1.2fr)_auto] lg:items-center lg:gap-4"
            >
              <div className="min-w-0">
                <Link
                  href={`/${workspaceDomain}/dashboard/projects/${project.nanoid}`}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {project.name}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {project.client_name ?? "No client"}
                  {project.deadline
                    ? ` · due ${formatMediumDate(project.deadline)}`
                    : ""}
                </p>
              </div>

              <p className="truncate text-sm text-muted-foreground">
                {project.company_name ?? "—"}
              </p>

              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    statusBadgeClass(project.status)
                  }`}
                >
                  {PROJECT_STATUS_LABELS[project.status]}
                </span>
              </div>

              <div>
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    priorityBadgeClass(project.priority)
                  }`}
                >
                  {PROJECT_PRIORITY_LABELS[project.priority]}
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <ProgressMeter
                  label="Tasks"
                  done={project.completed_tasks ?? 0}
                  total={project.task_count ?? 0}
                />
                <ProgressMeter
                  label="Deliverables"
                  done={project.completed_deliverables ?? 0}
                  total={project.deliverable_count ?? 0}
                />
              </div>

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="size-9 p-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(project)}
                  aria-label={`Delete ${project.name}`}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this project?"
        description={
          <div className="space-y-1">
            <p>“{deleteTarget?.name}” will be deleted.</p>
            <p className="text-xs text-muted-foreground">
              Its deliverables and their tasks go with it. This cannot be
              undone.
            </p>
          </div>
        }
        confirmLabel="Delete project"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteProjectAction({
            workspaceDomain,
            nanoid: deleteTarget.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The project could not be deleted.");
          }
        }}
      />
    </div>
  );
}
