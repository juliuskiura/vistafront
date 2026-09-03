import Link from "next/link";

import { getDeliverable, type Deliverable } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const DELIVERABLE_STATUS_LABELS: Record<Deliverable["status"], string> = {
  draft: "Draft",
  review: "In Review",
  revisions: "Revisions Requested",
  approved: "Approved",
  published: "Published",
  cancelled: "Cancelled",
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
  status: Deliverable["status"],
): "default" | "secondary" | "outline" {
  if (status === "published" || status === "approved") return "default";
  if (status === "cancelled") return "outline";
  return "secondary";
}

/**
 * Deliverable detail (Server Component, placeholder).
 *
 * Shows the deliverable metadata plus a flat list of tasks. Review,
 * approval, and revision actions will land in a follow-up — this
 * route exists today so the "Open" links on the project page resolve
 * to a real page.
 */
export default async function DeliverableDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);

  let deliverable: Deliverable;
  try {
    deliverable = await getDeliverable(id, active.domain);
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
          We couldn&apos;t load this deliverable. It may have been removed or
          you may no longer have access.
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/${active.domain}/dashboard/projects/${deliverable.project}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Back to {deliverable.project_name ?? "project"}
      </Link>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{deliverable.title}</h1>
          <p className="text-sm text-muted-foreground">
            {deliverable.deliverable_type ?? "Deliverable"}
            {deliverable.due_date ? ` · due ${formatDate(deliverable.due_date)}` : ""}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(deliverable.status)}>
          {DELIVERABLE_STATUS_LABELS[deliverable.status]}
        </Badge>
      </div>

      <Card className="rounded-xl border bg-card p-4 text-sm">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Assigned to</dt>
            <dd className="mt-1 font-medium">
              {deliverable.assigned_to_name ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted-foreground">Reviewed by</dt>
            <dd className="mt-1 font-medium">
              {deliverable.reviewed_by_name ?? "—"}
            </dd>
          </div>
        </dl>
      </Card>

      {deliverable.description ? (
        <Card className="rounded-xl border bg-card p-4 text-sm">
          <p className="whitespace-pre-wrap">{deliverable.description}</p>
        </Card>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Tasks
        </h2>
        {deliverable.tasks.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No tasks on this deliverable yet.
          </Card>
        ) : (
          <Card className="divide-y rounded-xl border bg-card">
            {deliverable.tasks.map((t) => (
              <Link
                key={t.nanoid}
                href={`/${active.domain}/dashboard/projects/tasks/${t.nanoid}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {t.assignee_name ?? "Unassigned"}
                    {t.due_date ? ` · due ${formatDate(t.due_date)}` : ""}
                  </p>
                </div>
                <Badge variant="outline">{t.status}</Badge>
              </Link>
            ))}
          </Card>
        )}
      </section>

      <Card className="rounded-xl border bg-card p-4 text-xs text-muted-foreground">
        Review, approve, and request-revision actions will land in a follow-up.
      </Card>
    </div>
  );
}