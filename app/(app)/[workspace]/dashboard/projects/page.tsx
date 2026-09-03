import Link from "next/link";

import { listCompanies, listProjects, type Company, type ProjectPriority, type ProjectStatus, type ProjectSummary } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<ProjectPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

function statusBadgeVariant(
  status: ProjectStatus,
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "completed") return "default";
  if (status === "cancelled") return "outline";
  if (status === "on_hold") return "secondary";
  return "secondary";
}

function priorityBadgeVariant(
  priority: ProjectPriority,
): "default" | "secondary" | "outline" | "destructive" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "default";
  if (priority === "medium") return "secondary";
  return "outline";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return value;
  }
}

/**
 * Projects list (Server Component).
 *
 * Server-side search via `searchParams.search` and filtering by `status`
 * and `priority`. Filtering is applied client-of-the-backend so we can
 * search across `name`, `company_name`, and `client_name` without
 * waiting for backend query support.
 */
export default async function ProjectsListPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{
    search?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
  }>;
}) {
  const { workspace: slug } = await params;
  const { search, status, priority } = await searchParams;
  const active = await requireWorkspace(slug);

  // Warm both in parallel; the company list is only needed for the
  // "New project" link label (and a future dropdown). Errors are
  // non-fatal — we just hide the company context.
  const [allProjects, companies] = await Promise.all([
    listProjects({ workspace: active.domain }).catch(() => [] as ProjectSummary[]),
    listCompanies({ workspace: active.domain }).catch(() => [] as Company[]),
  ]);

  const q = (search ?? "").trim().toLowerCase();
  const filtered = allProjects.filter((p) => {
    if (status && p.status !== status) return false;
    if (priority && p.priority !== priority) return false;
    if (!q) return true;
    return [p.name, p.company_name ?? "", p.client_name ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  const hasCompanies = companies.length > 0;
  const newProjectHref = hasCompanies
      ? `/${active.domain}/dashboard/projects/new`
      : null;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Active projects for {active.name}.
          </p>
        </div>
        {newProjectHref ? (
          <Button asChild>
            <Link href={newProjectHref}>New project</Link>
          </Button>
        ) : (
          <Button asChild variant="outline">
            <Link href={`/${active.domain}/dashboard/companies`}>
              Add a company first
            </Link>
          </Button>
        )}
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search projects…"
          className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">All statuses</option>
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          name="priority"
          defaultValue={priority ?? ""}
          className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">All priorities</option>
          {(Object.keys(PRIORITY_LABELS) as ProjectPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LABELS[p]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
        >
          Apply
        </button>
        {(q || status || priority) ? (
          <Link
            href={`/${active.domain}/dashboard/projects`}
            className="inline-flex h-9 items-center text-xs text-muted-foreground hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {q || status || priority
            ? "No projects match your filters."
            : "No projects yet. Create one to get started."}
        </Card>
      ) : (
        <Card className="divide-y rounded-xl border bg-card">
          {filtered.map((p) => (
            <ProjectRow
              key={p.nanoid}
              project={p}
              workspaceDomain={active.domain}
            />
          ))}
        </Card>
      )}
    </div>
  );
}

function ProjectRow({
  project,
  workspaceDomain,
}: {
  project: ProjectSummary;
  workspaceDomain: string;
}) {
  const taskTotal = project.task_count ?? 0;
  const tasksDone = project.completed_tasks ?? 0;
  const delivTotal = project.deliverable_count ?? 0;
  const delivDone = project.completed_deliverables ?? 0;

  return (
    <Link
      href={`/${workspaceDomain}/dashboard/projects/${project.nanoid}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{project.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[project.company_name, project.client_name]
            .filter(Boolean)
            .join(" · ") || "No company"}
          {project.deadline ? ` · due ${formatDate(project.deadline)}` : ""}
          {taskTotal > 0
            ? ` · ${tasksDone}/${taskTotal} tasks`
            : ""}
          {delivTotal > 0
            ? ` · ${delivDone}/${delivTotal} deliverables`
            : ""}
        </p>
      </div>
      <Badge variant={priorityBadgeVariant(project.priority)}>
        {PRIORITY_LABELS[project.priority]}
      </Badge>
      <Badge variant={statusBadgeVariant(project.status)}>
        {STATUS_LABELS[project.status]}
      </Badge>
    </Link>
  );
}