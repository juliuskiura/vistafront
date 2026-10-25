"use client";

import { useActionState, useEffect, useState } from "react";

import { RichTextEditor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PROJECT_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/lib/projects/constants";
import { createTaskAction, updateTaskAction } from "@/app/(app)/[workspace]/dashboard/projects/actions/task-actions";
import { initialProjectActionState } from "@/app/(app)/[workspace]/dashboard/projects/action-state";
import type { PickerOption } from "./project-form";

interface Props {
  workspaceDomain: string;
  /** Present when editing; absent when creating. */
  task?: {
    nanoid: string;
    title: string;
    description: string;
    project: string | null;
    parent: string | null;
    assignee: string | null;
    status: string;
    priority: string;
    due_date: string | null;
  };
  /** The workspace's projects — a task belongs to one of them. */
  projects: PickerOption[];
  /** The workspace's members, for the assignee picker. */
  members: PickerOption[];
  /** Pre-selected project, when the form was opened from one. */
  defaultProject?: string;
  submitLabel: string;
  onSuccess?: () => void;
}

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/**
 * The task form.
 *
 * A task belongs to a project directly via its `project` FK, and may have a
 * parent task via `parent`. The project picker therefore lists the
 * workspace's projects, and the form says so when there are none.
 */
export function TaskForm({
  workspaceDomain,
  task,
  projects,
  members,
  defaultProject,
  submitLabel,
  onSuccess,
}: Props) {
  const isEdit = Boolean(task);
  const action = isEdit ? updateTaskAction : createTaskAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialProjectActionState,
  );
  const [description, setDescription] = useState(task?.description ?? "");

  // A task belongs to a project, so a task created from a project has to name
  // one — otherwise it would be filed nowhere and never show up again. The
  // pick is only optional when there are no projects to pick from.
  const requireProject = !isEdit && projects.length > 0;
  const defaultProjectNanoid =
    task?.project ??
    defaultProject ??
    projects[0]?.nanoid ??
    "";

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
  }, [state, onSuccess]);

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_domain" value={workspaceDomain} />
      {task ? <input type="hidden" name="nanoid" value={task.nanoid} /> : null}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={task?.title ?? ""}
          placeholder="What needs doing?"
          required
          maxLength={255}
        />
        {errors.title ? (
          <p className="text-xs text-destructive">{errors.title[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="project">Project</Label>
          <select
            id="project"
            name="project"
            required={requireProject}
            defaultValue={defaultProjectNanoid}
            className={selectClass}
          >
            {projects.length === 0 ? (
              <option value="">No project</option>
            ) : null}
            {projects.map((project) => (
              <option key={project.nanoid} value={project.nanoid}>
                {project.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            A task belongs to a project.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="parent">Parent task (subtask)</Label>
          <select
            id="parent"
            name="parent"
            defaultValue={task?.parent ?? ""}
            className={selectClass}
          >
            <option value="">No parent</option>
          </select>
          <p className="text-xs text-muted-foreground">
            Optionally make this task a subtask of another.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="assignee">Assignee</Label>
          <select
            id="assignee"
            name="assignee"
            defaultValue={task?.assignee ?? ""}
            className={selectClass}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.nanoid} value={member.nanoid}>
                {member.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={task?.status ?? "todo"}
            className={selectClass}
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={task?.priority ?? "medium"}
            className={selectClass}
          >
            {PROJECT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="due_date">Due date</Label>
          <Input
            id="due_date"
            name="due_date"
            type="date"
            defaultValue={task?.due_date ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <input type="hidden" name="description" value={description} />
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="Any detail worth keeping?"
          showFooter={false}
          className="rounded-lg border"
        />
      </div>

      {formError ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {formError}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
