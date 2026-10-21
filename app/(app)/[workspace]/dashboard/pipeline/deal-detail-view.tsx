import Link from "next/link";

import { getDeal, getPipeline, type Pipeline } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { CrmInnerNav } from "@/components/crm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMediumDate } from "@/lib/dates";
import { DealDetailActions } from "@/app/(app)/[workspace]/dashboard/pipeline/_components/deal-detail-actions";

/**
 * Deal detail rendering.
 *
 * Used by both `/dashboard/pipeline/[id]` and `/dashboard/deals/[id]`.
 * The two routes share this rendering; the latter exists because some
 * links in the old SPA point to `/dashboard/deals/<nanoid>` directly.
 */
export async function DealDetailView({
  workspace,
  dealNanoid,
}: {
  workspace: string;
  dealNanoid: string;
}) {
  const active = await requireWorkspace(workspace);
  const deal = await getDeal(dealNanoid, active.domain).catch(() => null);

  if (!deal) {
    return (
      <div className="max-w-3xl">
        <Link
          href={`/${active.domain}/dashboard/pipeline`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Pipeline
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Deal not found</h1>
      </div>
    );
  }

  // The pipeline carries the stage list, which the "move" menu needs.
  const pipeline = deal.pipeline
    ? await getPipeline(deal.pipeline, active.domain).catch(
        () => null as Pipeline | null,
      )
    : null;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={deal.title}
        description={`${deal.pipeline_name ?? "Pipeline"} · ${deal.stage}`}
      />
      <CrmInnerNav workspaceDomain={active.domain} />
      <div className="mt-6 flex-1 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${active.domain}/dashboard/pipeline`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Pipeline
          </Link>
          <Badge
            variant={
              deal.status === "won"
                ? "default"
                : deal.status === "lost"
                  ? "outline"
                  : "secondary"
            }
          >
            {deal.status[0].toUpperCase() + deal.status.slice(1)}
          </Badge>
        </div>

        <DealDetailActions
          deal={deal}
          stages={pipeline?.stages ?? []}
          workspaceDomain={active.domain}
        />

        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Field
                label="Value"
                value={
                  deal.value > 0
                    ? new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: "USD",
                        maximumFractionDigits: 0,
                      }).format(deal.value)
                    : ""
                }
              />
              <Field
                label="Expected close"
                value={formatMediumDate(deal.expected_close_date)}
              />
              <Field
                label="Company"
                value={
                  deal.company ? (
                    <Link
                      href={`/${active.domain}/dashboard/companies/${deal.company}`}
                      className="text-primary hover:underline"
                    >
                      {deal.company_name ?? deal.company}
                    </Link>
                  ) : (
                    ""
                  )
                }
              />
              <Field
                label="Primary contact"
                value={
                  deal.contact ? (
                    <Link
                      href={`/${active.domain}/dashboard/contacts/${deal.contact}`}
                      className="text-primary hover:underline"
                    >
                      {deal.contact_name ?? deal.contact}
                    </Link>
                  ) : (
                    ""
                  )
                }
              />
              <Field label="Created" value={formatMediumDate(deal.created_at)} />
              <Field
                label="Last updated"
                value={formatMediumDate(deal.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>

        {deal.notes ? (
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm">{deal.notes}</p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}
