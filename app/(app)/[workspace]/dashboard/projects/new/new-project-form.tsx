"use client";

import { ProjectForm, type PickerOption } from "../forms/project-form";

interface Props {
  workspaceDomain: string;
}

/**
 * The "new project" form.
 *
 * A thin wrapper over the shared project form — the same form the record's
 * **Edit** button opens, so a project is created and edited in one place.
 */
export function NewProjectForm({ workspaceDomain }: Props) {
  return (
    <div className="max-w-3xl rounded-xl border bg-card p-6">
      <ProjectForm
        workspaceDomain={workspaceDomain}
        submitLabel="Create project"
      />
    </div>
  );
}
