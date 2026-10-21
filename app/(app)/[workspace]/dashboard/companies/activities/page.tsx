import Link from "next/link";

import { listActivities } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { Card } from "@/components/ui/card";
import { formatMediumDate } from "@/lib/dates";

/**
 * The cross-company activities list.
 *
 * Every scheduled piece of work across the workspace — the "what is
 * outstanding" view that the company record cannot give on its own.
 */
export default async function ActivitiesListPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const activities = await listActivities({
    workspace: active.domain,
  }).catch(() => []);

  const outstanding = activities.filter((a) => !a.completed_at);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Activities"
        description="Every scheduled call, email and meeting across the workspace."
      />
      <div className="mt-6 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {outstanding.length} outstanding of {activities.length} total
          </p>
          <Link
            href={`/${active.domain}/dashboard/companies`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Companies
          </Link>
        </div>

        {activities.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No activities yet. Add one from a company record.
          </Card>
        ) : (
          <Card className="divide-y rounded-xl border bg-card">
            {activities.map((a) => (
              <div key={a.nanoid} className="px-4 py-3">
                <p
                  className={`truncate text-sm font-medium ${
                    a.completed_at
                      ? "text-muted-foreground line-through"
                      : ""
                  }`}
                >
                  {a.subject}
                </p>
                <p className="text-xs text-muted-foreground">
                  {a.action_type_name}
                  {a.due_at ? ` · due ${formatMediumDate(a.due_at)}` : ""}
                  {" · "}
                  {formatMediumDate(a.created_at)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
