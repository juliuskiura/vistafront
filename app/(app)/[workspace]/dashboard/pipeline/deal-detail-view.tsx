import Link from "next/link";

import { getDeal } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Deal detail rendering (pure presentational helper).
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

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/${active.domain}/dashboard/pipeline`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Pipeline
      </Link>

      <div className="flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold">{deal.title}</h1>
          <p className="text-sm text-muted-foreground">
            {deal.pipeline_name ?? "—"} · {deal.stage}
          </p>
        </div>
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
              value={
                deal.expected_close_date
                  ? new Date(deal.expected_close_date).toLocaleDateString()
                  : ""
              }
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
                  "—"
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
                  "—"
                )
              }
            />
            <Field
              label="Created"
              value={new Date(deal.created_at).toLocaleDateString()}
            />
            <Field
              label="Last updated"
              value={new Date(deal.updated_at).toLocaleDateString()}
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