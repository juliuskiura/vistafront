import Link from "next/link";

import { getTask, type Task } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Card } from "@/components/ui/card";

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
 * Task detail (Server Component, placeholder).
 *
 * Fetches and renders the basic task metadata. The interactive UX for
 * editing status, assignee, and due date will land in a follow-up —
 * this route exists today so sidebar links and deep links resolve
 * cleanly.
 */
export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);

  let task: Task;
  try {
    task = await getTask(id, active.domain);
  } catch {
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <Card className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this task. It may have been removed or you may
          no longer have access.
        </Card>
      </div>
    );
  }

  const backHref = task.project
    ? `/${active.domain}/dashboard/projects/${task.project}`
    : `/${active.domain}/dashboard/projects`;

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={backHref}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Back
      </Link>
      <div>
        <h1 className="text-xl font-semibold">{task.title}</h1>
        <p className="text-sm text-muted-foreground">
          {task.project_name ? `Part of ${task.project_name}` : "Task"}
        </p>
      </div>

      <Card className="rounded-xl border bg-card p-4 text-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Status</dt>
            <dd className="mt-1 font-medium">{task.status}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Priority</dt>
            <dd className="mt-1 font-medium">{task.priority}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Assignee</dt>
            <dd className="mt-1 font-medium">{task.assignee_name ?? "Unassigned"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Due</dt>
            <dd className="mt-1 font-medium">{formatDate(task.due_date)}</dd>
          </div>
        </dl>
      </Card>

      {task.description ? (
        <Card className="rounded-xl border bg-card p-4 text-sm">
          <p className="whitespace-pre-wrap">{task.description}</p>
        </Card>
      ) : null}

      <Card className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        Task editing and comments will land in a follow-up.
      </Card>
    </div>
  );
}