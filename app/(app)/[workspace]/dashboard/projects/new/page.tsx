import Link from "next/link";

import { listCompanies, listProjects, type Company, type ProjectPriority, type ProjectStatus } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";
import { NewProjectForm } from "@/app/(app)/[workspace]/dashboard/projects/new/new-project-form";

const STATUS_OPTIONS: Array<{ value: ProjectStatus; label: string }> = [
  { value: "planning", label: "Planning" },
  { value: "in_progress", label: "In Progress" },
  { value: "on_hold", label: "On Hold" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const PRIORITY_OPTIONS: Array<{ value: ProjectPriority; label: string }> = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

/**
 * New project page (Server Component).
 *
 * Pre-fetches the list of companies in the active workspace so the form
 * can pick one. If no companies exist, we render an empty state pointing
 * the user to the CRM rather than showing a broken dropdown.
 */
export default async function NewProjectPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const [companies, projects] = await Promise.all([
    listCompanies({ workspace: active.domain }).catch(() => [] as Company[]),
    listProjects({ workspace: active.domain }).catch(() => []),
  ]);

  if (companies.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-xl font-semibold">New project</h1>
          <p className="text-sm text-muted-foreground">
            Projects belong to a company — add a company in the CRM first.
          </p>
        </div>
        <Card className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          You don&apos;t have any companies in {active.name} yet.{" "}
          <Link
            href={`/${active.domain}/dashboard/companies`}
            className="text-primary hover:underline"
          >
            Go to Companies →
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">New project</h1>
        <p className="text-sm text-muted-foreground">
          Start a new project for {active.name}.
        </p>
      </div>
      <NewProjectForm
        workspaceDomain={active.domain}
        companies={companies.map((c) => ({ nanoid: c.nanoid, name: c.name }))}
        statusOptions={STATUS_OPTIONS}
        priorityOptions={PRIORITY_OPTIONS}
        hasProjects={projects.length > 0}
      />
    </div>
  );
}