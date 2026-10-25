"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { Attachment, Comment, Task } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import { Edit3, Trash2 } from "@/lib/icons";
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
import { RichText } from "../../_components/rich-text";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import { deleteTaskAction } from "../../actions/task-actions";
import { TaskAttachments } from "./_components/task-attachments";
import { TaskComments } from "./_components/task-comments";

interface Props {
  task: Task;
  workspaceDomain: string;
  comments: Comment[];
  attachments: Attachment[];
  members: PickerOption[];
  projects: PickerOption[];
}

export function TaskRecord({
  task,
  workspaceDomain,
  comments,
  attachments,
  members,
  projects,
}: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Link
                  href={`/${workspaceDomain}/dashboard/projects`}
                  className="text-slate-500 hover:underline"
                >
                  Projects
                </Link>
                {task.project ? (
                  <>
                    <span className="text-slate-300">/</span>
                    <Link
                      href={`/${workspaceDomain}/dashboard/projects/${task.project}?tab=tasks`}
                      className="text-slate-500 hover:underline"
                    >
                      {task.project_name}
                    </Link>
                  </>
                ) : null}

                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border ${statusBadgeClass(
                    task.status,
                  )}`}
                >
                  {TASK_STATUS_LABELS[task.status]}
                </span>
                <span
                  className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border ${priorityBadgeClass(
                    task.priority,
                  )}`}
                >
                  Priority: {PROJECT_PRIORITY_LABELS[task.priority]}
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  nanoid: {task.nanoid}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-tight">
                {task.title}
              </h1>

              {task.description ? (
                <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                  {task.description}
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Project:</span>
                  {task.project ? (
                    <Link
                      href={`/${workspaceDomain}/dashboard/projects/${task.project}`}
                      className="font-semibold text-slate-800 hover:underline"
                    >
                      {task.project_name ?? "Open project"}
                    </Link>
                  ) : (
                    <span className="text-slate-800">No project</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-400">Assignee:</span>
                  <span className="text-slate-800 font-medium">
                    {task.assignee_name ?? "Unassigned"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono tabular-nums">
                  <span className="text-slate-400">Due:</span>
                  <span className="text-slate-700 font-medium">
                    {formatMediumDate(task.due_date)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
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

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Description
        </h3>
        {task.description ? (
          <RichText html={task.description} className="mt-3" />
        ) : (
          <p className="mt-3 text-sm text-slate-500">No description yet.</p>
        )}
      </div>

      <TaskComments
        targetNanoid={task.nanoid}
        comments={comments}
        workspaceDomain={workspaceDomain}
      />

      <TaskAttachments
        targetNanoid={task.nanoid}
        attachments={attachments}
        workspaceDomain={workspaceDomain}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the details of this task.</DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            task={task}
            projects={projects}
            members={members}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this task?"
        description="This task will be deleted. This cannot be undone."
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteTaskAction({
            workspaceDomain,
            nanoid: task.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The task could not be deleted.");
          } else {
            router.push(`/${workspaceDomain}/dashboard/projects`);
          }
        }}
      />
    </div>
  );
}
