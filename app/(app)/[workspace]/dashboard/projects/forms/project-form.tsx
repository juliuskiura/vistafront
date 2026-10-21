"use client";

import { useActionState, useEffect, useState } from "react";

import { RichTextEditor } from "@/components/editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PROJECT_CATEGORY_OPTIONS,
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "@/lib/projects/constants";
import { createProjectAction, updateProjectAction } from "@/app/(app)/[workspace]/dashboard/projects/actions/project-actions";
import { initialProjectActionState } from "@/app/(app)/[workspace]/dashboard/projects/action-state";

/** A picker entry — the two relation fields need nothing more than this. */
export interface PickerOption {
  nanoid: string;
  name: string;
}

interface Props {
  workspaceDomain: string;
  /** Present when editing; absent when creating. */
  project?: {
    nanoid: string;
    name: string;
    description: string;
    company: string;
    client: string | null;
    category: string | null;
    status: string;
    priority: string;
    start_date: string | null;
    deadline: string | null;
  };
  companies: PickerOption[];
  clients: PickerOption[];
  submitLabel: string;
  /** Called after a successful save, so the caller can close its dialog. */
  onSuccess?: () => void;
}

const selectClass =
  "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/**
 * The project form.
 *
 * One form for both creating and editing: the fields are the same, and the
 * only difference is which action runs and whether the record's nanoid is
 * already known.
 *
 * The description is rich text, so it uses the shared editor rather than a
 * textarea — a textarea over stored HTML destroys the formatting on the
 * first save. The editor's HTML rides along in a hidden input, so the form
 * still submits when the editor has not been touched.
 */
export function ProjectForm({
  workspaceDomain,
  project,
  companies,
  clients,
  submitLabel,
  onSuccess,
}: Props) {
  const isEdit = Boolean(project);
  const action = isEdit ? updateProjectAction : createProjectAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialProjectActionState,
  );
  const [description, setDescription] = useState(project?.description ?? "");

  useEffect(() => {
    if (state.status === "success") onSuccess?.();
  }, [state, onSuccess]);

  const errors = state.status === "error" ? state.fieldErrors ?? {} : {};
  const formError = state.status === "error" ? state.message : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="workspace_domain" value={workspaceDomain} />
      {project ? (
        <input type="hidden" name="nanoid" value={project.nanoid} />
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="name">Project name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={project?.name ?? ""}
          placeholder="e.g. Q4 launch campaign"
          required
          maxLength={255}
        />
        {errors.name ? (
          <p className="text-xs text-destructive">{errors.name[0]}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="company">Company</Label>
          <select
            id="company"
            name="company"
            required
            defaultValue={project?.company ?? ""}
            className={selectClass}
          >
            <option value="" disabled>
              Pick a company…
            </option>
            {companies.map((company) => (
              <option key={company.nanoid} value={company.nanoid}>
                {company.name}
              </option>
            ))}
          </select>
          {errors.company ? (
            <p className="text-xs text-destructive">{errors.company[0]}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="client">Client</Label>
          <select
            id="client"
            name="client"
            defaultValue={project?.client ?? ""}
            className={selectClass}
          >
            <option value="">No client</option>
            {clients.map((client) => (
              <option key={client.nanoid} value={client.nanoid}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            defaultValue={project?.category ?? ""}
            className={selectClass}
          >
            <option value="">No category</option>
            {PROJECT_CATEGORY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={project?.status ?? "planning"}
            className={selectClass}
          >
            {PROJECT_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="priority">Priority</Label>
          <select
            id="priority"
            name="priority"
            defaultValue={project?.priority ?? "medium"}
            className={selectClass}
          >
            {PROJECT_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            defaultValue={project?.start_date ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input
            id="deadline"
            name="deadline"
            type="date"
            defaultValue={project?.deadline ?? ""}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <input type="hidden" name="description" value={description} />
        <RichTextEditor
          value={description}
          onChange={setDescription}
          placeholder="What is this project about?"
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
