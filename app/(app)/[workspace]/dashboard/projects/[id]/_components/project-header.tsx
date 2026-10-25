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
    <div className="space-y-6">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {project.category ? (
                  <span
                    className="px-2 py-0.5 rounded font-mono font-bold text-[11px] border bg-slate-50 border-slate-200 text-slate-700"
                  >
                    {projectCategoryLabel(project.category)}
                  </span>
                ) : null}

                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border ${statusBadgeClass(
                    status,
                  )}`}
                >
                  {PROJECT_STATUS_OPTIONS.find((option) => option.value === status)
                    ?.label ?? status}
                </span>

                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border ${priorityBadgeClass(
                    project.priority,
                  )}`}
                >
                  Priority: {PROJECT_PRIORITY_LABELS[project.priority]}
                </span>

                <span className="font-mono text-[11px] text-slate-400">
                  nanoid: {project.nanoid}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {project.name}
              </h1>

              {project.description ? (
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {project.description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                {project.company_name ? (
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="size-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800">
                      {project.company_name}
                    </span>
                  </div>
                ) : null}
                {project.client_name ? (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5 text-slate-400" />
                    <span className="text-slate-800 font-medium">
                      {project.client_name}
                    </span>
                  </div>
                ) : null}

                <div className="flex items-center gap-1.5 font-mono tabular-nums">
                  <CalendarIcon className="size-3.5 text-slate-400" />
                  <span>{formatMediumDate(project.start_date)}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-slate-700 font-medium">
                    {formatMediumDate(project.deadline)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between w-full lg:w-72 shrink-0">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
                  <span>Task Execution Rate</span>
                  <span className="font-mono tabular-nums text-indigo-600 font-bold">
                    {rate}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-3">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600">
                  <span className="font-mono tabular-nums font-semibold">
                    {doneTasks}
                  </span>{" "}
                  / {totalTasks} tasks done
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <select
                  id="project-status"
                  value={status}
                  disabled={statusPending}
                  onChange={(event) => handleStatusChange(event.target.value)}
                  className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs"
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
