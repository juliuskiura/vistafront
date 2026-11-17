import type { Project } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import {
  PROJECT_PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  projectCategoryLabel,
} from "@/lib/projects/constants";
import { RichText } from "../../_components/rich-text";
import { ProjectHeader } from "@/app/(app)/[workspace]/dashboard/projects/[id]/_components/project-header";

interface Props {
  project: Project;
  workspaceDomain: string;
}

/**
 * The project's overview.
 *
 * Every field is read-only here; the header's **Edit** button opens the
 * same form the create page uses, so there is one place where a project's
 * fields are written.
 */
export function OverviewTab({ project,workspaceDomain }: Props) {
  const fields: Array<{ label: string; value: string }> = [
    { label: "Company", value: project.company_name ?? "No company" },
    { label: "Category", value: projectCategoryLabel(project.category) },
    { label: "Status", value: PROJECT_STATUS_LABELS[project.status] },
    { label: "Priority", value: PROJECT_PRIORITY_LABELS[project.priority] },
    { label: "Start date", value: formatMediumDate(project.start_date) },
    { label: "Deadline", value: formatMediumDate(project.deadline) },
    { label: "Created", value: formatMediumDate(project.created_at) },
  ];

  return (
    <div className="space-y-4">
      <ProjectHeader
              project={project}
              workspaceDomain={workspaceDomain}
            />
      <div className="rounded-xl border bg-card p-4">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => (
            <div key={field.label}>
              <dt className="text-xs uppercase text-muted-foreground">
                {field.label}
              </dt>
              <dd className="mt-1 text-sm font-medium">{field.value}</dd>
            </div>
          ))}
        </dl>
      </div>

    
    </div>
  );
}
