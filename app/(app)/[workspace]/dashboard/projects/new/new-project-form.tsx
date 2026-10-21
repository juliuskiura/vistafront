"use client";

import { ProjectForm, type PickerOption } from "../forms/project-form";

interface Props {
  workspaceDomain: string;
  companies: PickerOption[];
  clients: PickerOption[];
}

/**
 * The "new project" form.
 *
 * A thin wrapper over the shared project form — the same form the record's
 * **Edit** button opens, so a project is created and edited in one place.
 */
export function NewProjectForm({ workspaceDomain, companies, clients }: Props) {
  return (
    <div className="max-w-3xl rounded-xl border bg-card p-6">
      <ProjectForm
        workspaceDomain={workspaceDomain}
        companies={companies}
        clients={clients}
        submitLabel="Create project"
      />
    </div>
  );
}
