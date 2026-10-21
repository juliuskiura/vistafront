import Link from "next/link";

import { listLeads } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { Card } from "@/components/ui/card";
import { formatMediumDate } from "@/lib/dates";

/**
 * The cross-company leads list.
 *
 * Every qualified lead across the workspace, with the company it belongs
 * to.
 */
export default async function LeadsListPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const leads = await listLeads({ workspace: active.domain }).catch(() => []);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Leads"
        description="Every qualified lead across the workspace."
      />
      <div className="mt-6 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {leads.length} lead{leads.length === 1 ? "" : "s"}
          </p>
          <Link
            href={`/${active.domain}/dashboard/companies`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Companies
          </Link>
        </div>

        {leads.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No leads yet. Add one from a company record.
          </Card>
        ) : (
          <Card className="divide-y rounded-xl border bg-card">
            {leads.map((lead) => (
              <div key={lead.nanoid} className="px-4 py-3">
                <p className="truncate text-sm font-medium">{lead.source}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.status}
                  {lead.contact_name ? ` · ${lead.contact_name}` : ""}
                  {" · "}
                  {formatMediumDate(lead.created_at)}
                </p>
                {lead.notes ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {lead.notes}
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
