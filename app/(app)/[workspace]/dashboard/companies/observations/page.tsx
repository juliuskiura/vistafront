import Link from "next/link";

import { listObservations } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { Card } from "@/components/ui/card";
import { formatMediumDate } from "@/lib/dates";

/**
 * The cross-company observations list.
 *
 * The backend cannot register a sidebar entry for observations, so this
 * view is reachable from the Companies list header instead. It is a plain
 * server-rendered table — the same data as the company record's
 * observations tab, across every company.
 */
export default async function ObservationsListPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const observations = await listObservations({
    workspace: active.domain,
  }).catch(() => []);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Observations"
        description="Everything you have noticed, across every company in the workspace."
      />
      <div className="mt-6 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {observations.length} observation
            {observations.length === 1 ? "" : "s"}
          </p>
          <Link
            href={`/${active.domain}/dashboard/companies`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Companies
          </Link>
        </div>

        {observations.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No observations yet. Add one from a company record.
          </Card>
        ) : (
          <Card className="divide-y rounded-xl border bg-card">
            {observations.map((o) => (
              <div key={o.nanoid} className="px-4 py-3">
                <p className="truncate text-sm font-medium">{o.title}</p>
                <p className="text-xs text-muted-foreground">
                  {o.category_name}
                  {o.severity ? ` · severity ${o.severity}` : ""}
                  {" · "}
                  {formatMediumDate(o.created_at)}
                </p>
                {o.description ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {o.description}
                  </p>
                ) : null}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
