import Link from "next/link";

import { getDeliverable, getProject, listDeliverables, listTasks, type Deliverable, type DeliverableSummary, type Project, type Task } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const STATUS_LABELS: Record<Project["status"], string> = {
  planning: "Planning",
  in_progress: "In Progress",
  on_hold: "On Hold",
  completed: "Completed",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<Project["priority"], string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const DELIVERABLE_STATUS_LABELS: Record<DeliverableSummary["status"], string> = {
  draft: "Draft",
  review: "In Review",
  revisions: "Revisions Requested",
  approved: "Approved",
  published: "Published",
  cancelled: "Cancelled",
};

const TASK_STATUS_LABELS: Record<Task["status"], string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

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

function statusBadgeVariant(
  status: Project["status"],
): "default" | "secondary" | "outline" {
  if (status === "completed") return "default";
  if (status === "cancelled") return "outline";
  return "secondary";
}

function priorityBadgeVariant(
  priority: Project["priority"],
): "default" | "secondary" | "outline" | "destructive" {
  if (priority === "urgent") return "destructive";
  if (priority === "high") return "default";
  if (priority === "medium") return "secondary";
  return "outline";
}

function deliverableStatusVariant(
  status: DeliverableSummary["status"],
): "default" | "secondary" | "outline" {
  if (status === "published" || status === "approved") return "default";
  if (status === "cancelled") return "outline";
  return "secondary";
}

/**
 * Project detail (Server Component).
 *
 * Shows project metadata plus a flat list of deliverables and tasks. The
 * underlying serializers nest tasks inside deliverables (and deliverables
 * expose `project_tasks`), so for clarity we fetch the project's
 * deliverables and tasks directly and render the merged picture here.
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);

  let project: Project;
  try {
    project = await getProject(id, active.domain);
  } catch (error) {
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <Card className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this project. It may have been removed or you
          may no longer have access.
        </Card>
      </div>
    );
  }

  const [deliverables, tasks] = await Promise.all([
    listDeliverables({ project: project.nanoid, workspace: active.domain }).catch(
      () => [] as DeliverableSummary[],
    ),
    listTasks({ project: project.nanoid, workspace: active.domain }).catch(
      () => [] as Task[],
    ),
  ]);

  // Make sure deliverable payloads are loaded for each row. The list
  // endpoint returns slimmer rows; the detail payload includes the
  // nested tasks we want to display inline. We fetch them in parallel
  // and silently fall back to the summary if any single fetch fails.
  const detailed: Array<{
    summary: DeliverableSummary;
    detail: Deliverable | null;
  }> = await Promise.all(
    deliverables.map(async (summary) => {
      try {
        const detail = await getDeliverable(summary.nanoid, active.domain);
        return { summary, detail };
      } catch {
        return { summary, detail: null };
      }
    }),
  );

  const taskTotal = project.task_count ?? 0;
  const tasksDone = project.completed_tasks ?? 0;
  const delivTotal = project.deliverable_count ?? 0;
  const delivDone = project.completed_deliverables ?? 0;

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">
              {project.company_name ?? "No company"}
              {project.client_name ? ` · ${project.client_name}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={priorityBadgeVariant(project.priority)}>
              {PRIORITY_LABELS[project.priority]}
            </Badge>
            <Badge variant={statusBadgeVariant(project.status)}>
              {STATUS_LABELS[project.status]}
            </Badge>
          </div>
        </div>
      </div>

      <Card className="rounded-xl border bg-card p-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 md:grid-cols-4">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Start</dt>
            <dd className="mt-1 font-medium">{formatDate(project.start_date)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Deadline</dt>
            <dd className="mt-1 font-medium">{formatDate(project.deadline)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Tasks</dt>
            <dd className="mt-1 font-medium">
              {tasksDone} / {taskTotal}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Deliverables</dt>
            <dd className="mt-1 font-medium">
              {delivDone} / {delivTotal}
            </dd>
          </div>
        </dl>
      </Card>

      {project.description ? (
        <Card className="rounded-xl border bg-card p-4 text-sm">
          <p className="whitespace-pre-wrap">{project.description}</p>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Deliverables
        </h2>
        {detailed.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No deliverables yet.
          </Card>
        ) : (
          <Card className="divide-y rounded-xl border bg-card">
            {detailed.map(({ summary, detail }) => (
              <DeliverableRow
                key={summary.nanoid}
                summary={summary}
                detail={detail}
                workspaceDomain={active.domain}
              />
            ))}
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tasks
        </h2>
        {tasks.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No tasks yet.
          </Card>
        ) : (
          <Card className="divide-y rounded-xl border bg-card">
            {tasks.map((t) => (
              <TaskRow
                key={t.nanoid}
                task={t}
                workspaceDomain={active.domain}
              />
            ))}
          </Card>
        )}
      </section>
    </div>
  );
}

function DeliverableRow({
  summary,
  detail,
  workspaceDomain,
}: {
  summary: DeliverableSummary;
  detail: Deliverable | null;
  workspaceDomain: string;
}) {
  const taskList = detail?.tasks ?? detail?.project_tasks ?? [];
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{summary.title}</p>
          <p className="text-xs text-muted-foreground">
            {summary.deliverable_type ?? "—"}
            {summary.due_date ? ` · due ${formatDate(summary.due_date)}` : ""}
            {taskList.length > 0
              ? ` · ${taskList.length} task${taskList.length === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={deliverableStatusVariant(summary.status)}>
            {DELIVERABLE_STATUS_LABELS[summary.status]}
          </Badge>
          <Link
            href={`/${workspaceDomain}/dashboard/deliverables/${summary.nanoid}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}

function TaskRow({
  task,
  workspaceDomain,
}: {
  task: Task;
  workspaceDomain: string;
}) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{task.title}</p>
          <p className="text-xs text-muted-foreground">
            {task.assignee_name ?? "Unassigned"}
            {task.due_date ? ` · due ${formatDate(task.due_date)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{TASK_STATUS_LABELS[task.status]}</Badge>
          <Link
            href={`/${workspaceDomain}/dashboard/projects/tasks/${task.nanoid}`}
            className="text-xs text-muted-foreground hover:underline"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}