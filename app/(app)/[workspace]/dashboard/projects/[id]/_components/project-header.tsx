"use client";

import Link from "next/link";
import { useState } from "react";

import type { Project } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import {
  Briefcase,
  Building2,
  CalendarIcon,
  Edit3,
  Tag,
  Trash2,
} from "@/lib/icons";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_OPTIONS,
  projectCategoryLabel,
  priorityBadgeClass,
  statusBadgeClass,
} from "@/lib/projects/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProgressMeter } from "../../_components/project-progress";
import { ProjectForm } from "../../forms/project-form";
import type { PickerOption } from "../../forms/project-form";
import {
  deleteProjectAction,
  updateProjectStatusAction,
} from "../../actions/project-actions";

interface Props {
  project: Project;
  workspaceDomain: string;
  companies: PickerOption[];
  clients: PickerOption[];
}

/**
 * The project record's header.
 *
 * The name lives in the page banner; this row carries what the banner
 * cannot — the status control, the badges, the progress bars, and the
 * record's actions.
 */
export function ProjectHeader({
  project,
  workspaceDomain,
  companies,
  clients,
}: Props) {
  const [status, setStatus] = useState(project.status);
  const [statusPending, setStatusPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The record is re-rendered after every save; keep the dropdown in step
  // with what the server now holds. Adjusting during render (rather than
  // in an effect) is React's own way to react to a changed prop without a
  // second paint.
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {/* The banner shows the name; this keeps the page's heading for
            assistive technology and search engines. */}
        <h1 className="sr-only">{project.name}</h1>

        <Link
          href={`/${workspaceDomain}/dashboard/projects`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Projects
        </Link>

        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            statusBadgeClass(status)
          }`}
        >
          {PROJECT_STATUS_OPTIONS.find((option) => option.value === status)
            ?.label ?? status}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            priorityBadgeClass(project.priority)
          }`}
        >
          {PROJECT_PRIORITY_LABELS[project.priority]}
        </span>
        {project.category ? (
          <Badge variant="soft" className="gap-1">
            <Tag className="size-3" aria-hidden="true" />
            {projectCategoryLabel(project.category)}
          </Badge>
        ) : null}
        {project.client_name ? (
          <Badge variant="outline" className="gap-1">
            <Building2 className="size-3" aria-hidden="true" />
            {project.client_name}
          </Badge>
        ) : null}
        {project.company_name ? (
          <Badge variant="outline" className="gap-1">
            <Briefcase className="size-3" aria-hidden="true" />
            {project.company_name}
          </Badge>
        ) : null}

        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="project-status" className="sr-only">
            Project status
          </label>
          <select
            id="project-status"
            value={status}
            disabled={statusPending}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

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

      {actionError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      ) : null}

      <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            Deadline
          </p>
          <p className="mt-1 text-sm font-medium">
            {formatMediumDate(project.deadline)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-muted-foreground">Start</p>
          <p className="mt-1 text-sm font-medium">
            {formatMediumDate(project.start_date)}
          </p>
        </div>
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
            companies={companies}
            clients={clients}
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
              “{project.name}” and everything under it — its deliverables and
              their tasks — will be deleted. This cannot be undone.
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
