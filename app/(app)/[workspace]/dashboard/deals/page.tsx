import Link from "next/link";

import { listDeals, type Deal } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { CrmInnerNav } from "@/components/crm";
import { Card } from "@/components/ui/card";
import { formatMediumDate } from "@/lib/dates";

/**
 * The deals list.
 *
 * This route exists because the sidebar advertises a "Deals" link but only
 * the per-deal route (`/dashboard/deals/[id]`) was implemented — the link
 * landed on the catch-all and 404'd. The list is the landing page the nav
 * points at.
 */
export default async function DealsListPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const deals = await listDeals({ workspace: active.domain }).catch(
    () => [] as Deal[],
  );

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Deals"
        description="Every deal across your pipelines."
      />
      <CrmInnerNav workspaceDomain={active.domain} />
      <div className="mt-6 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {deals.length} deal{deals.length === 1 ? "" : "s"}
          </p>
          <Link
            href={`/${active.domain}/dashboard/pipeline`}
            className="text-sm text-muted-foreground hover:underline"
          >
            Open the board →
          </Link>
        </div>

        {deals.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            No deals yet. Create one from the pipeline board.
          </Card>
        ) : (
          <Card className="overflow-x-auto rounded-xl border bg-card">
            <table className="w-full min-w-[52rem] text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Stage</th>
                  <th className="px-4 py-3 font-medium">Value</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Close date</th>
                </tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr
                    key={d.nanoid}
                    className="border-b last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/${active.domain}/dashboard/deals/${d.nanoid}`}
                        className="font-medium hover:underline"
                      >
                        {d.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.stage}</td>
                    <td className="px-4 py-3 font-medium">
                      {d.value > 0 ? formatCurrency(d.value) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                        {d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.company ? (
                        <Link
                          href={`/${active.domain}/dashboard/companies/${d.company}`}
                          className="hover:underline"
                        >
                          {d.company_name ?? d.company}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d.contact ? (
                        <Link
                          href={`/${active.domain}/dashboard/contacts/${d.contact}`}
                          className="hover:underline"
                        >
                          {d.contact_name ?? d.contact}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMediumDate(d.expected_close_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
