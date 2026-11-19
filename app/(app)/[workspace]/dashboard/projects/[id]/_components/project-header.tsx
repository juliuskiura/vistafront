"use client";

import { useState } from "react";

import type { Project } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import {
  Briefcase,
  CalendarIcon,
  Edit3,
  Trash2,
} from "@/lib/icons";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_OPTIONS,
  projectCategoryLabel,
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
import { ProjectForm } from "../../forms/project-form";
import {
  deleteProjectAction,
  updateProjectStatusAction,
} from "../../actions/project-actions";
import { RichText } from "@/app/(app)/[workspace]/dashboard/projects/_components/rich-text";

interface Props {
  project: Project;
  workspaceDomain: string;
}

export function ProjectHeader({
  project,
  workspaceDomain,
}: Props) {
  const [status, setStatus] = useState(project.status);
  const [statusPending, setStatusPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [serverStatus, setServerStatus] = useState(project.status);
  if (project.status !== serverStatus) {
    setServerStatus(project.status);
    setStatus(project.status);
  }

  async function handleStatusChange(next: string) {
    const previous = status;
    setStatus(next as Project["status"]);
    setStatusPending(true);
    setActionError(null);

    const result = await updateProjectStatusAction({
      workspaceDomain,
      nanoid: project.nanoid,
      status: next,
    });

    setStatusPending(false);
    if (result.status === "error") {
      setStatus(previous);
      setActionError(result.message ?? "The status could not be changed.");
    }
  }

  const totalTasks = project.task_count ?? 0;
  const doneTasks = project.completed_tasks ?? 0;
  const rate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {project.category ? (
          <span className="rounded border bg-muted px-2 py-0.5 font-medium text-muted-foreground">
            {projectCategoryLabel(project.category)}
          </span>
        ) : null}

        <span
          className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${statusBadgeClass(
            status,
          )}`}
        >
          {PROJECT_STATUS_OPTIONS.find((option) => option.value === status)
            ?.label ?? status}
        </span>

        <span
          className={`rounded border px-2 py-0.5 text-[10px] font-semibold uppercase ${priorityBadgeClass(
            project.priority,
          )}`}
        >
          Priority: {PROJECT_PRIORITY_LABELS[project.priority]}
        </span>

        <span className="font-mono text-[11px] text-muted-foreground">
          PROJECT ID: {project.project_id}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {project.company_name ? (
          <div className="flex items-center gap-1.5">
            <Briefcase className="size-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {project.company_name}
            </span>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5 tabular-nums">
          <CalendarIcon className="size-3.5 text-muted-foreground" />
          <span>{formatMediumDate(project.start_date)}</span>
          <span className="text-muted-foreground/60">→</span>
          <span className="font-medium text-foreground">
            {formatMediumDate(project.deadline)}
          </span>
        </div>
      </div>

      {project.description ? (
        <RichText
          html={project.description}
          className="text-xs text-muted-foreground leading-relaxed max-w-2xl mt-3"
          words={200}
        />
      ) : null}

      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="w-full lg:max-w-sm">
            <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Task Execution Rate</span>
              <span className="font-mono tabular-nums font-bold text-primary">
                {rate}%
              </span>
            </div>
            <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${rate}%` }}
              />
            </div>
            <div className="text-xs text-muted-foreground">
              <span className="font-mono tabular-nums font-semibold text-foreground">
                {doneTasks}
              </span>{" "}
              / {totalTasks} tasks done
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              id="project-status"
              value={status}
              disabled={statusPending}
              onChange={(event) => handleStatusChange(event.target.value)}
              className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
            >
              {PROJECT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setEditOpen(true)}
            >
              <Edit3 className="size-3.5" aria-hidden="true" />
              Edit
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 text-xs"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit project</DialogTitle>
            <DialogDescription>
              Update the details of this project.
            </DialogDescription>
          </DialogHeader>
          <ProjectForm
            workspaceDomain={workspaceDomain}
            project={project}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this project?"
        description={
          <div className="space-y-2">
            <p>
              “{project.name}” and everything under it — its tasks — will be
              deleted. This cannot be undone.
            </p>
          </div>
        }
        confirmLabel="Delete project"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteProjectAction({
            workspaceDomain,
            nanoid: project.nanoid,
          });
          if (result.status === "error") {
            setActionError(result.message ?? "The project could not be deleted.");
          }
        }}
      />
    </div>
  );
}
