import Link from "next/link";

import { getCompany, type ProspectStatus } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PROSPECT_LABELS: Record<ProspectStatus, string> = {
  identified: "Identified",
  researching: "Researching",
  contact_ready: "Contact Ready",
  outreach_sent: "Outreach Sent",
  engaged: "Engaged",
  qualified: "Qualified",
  customer: "Customer",
  lost: "Lost",
};

/**
 * Company detail (Server Component).
 */
export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  const company = await getCompany(id, active.domain).catch(() => null);

  if (!company) {
    return (
      <div className="max-w-3xl">
        <Link
          href={`/${active.domain}/dashboard/companies`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Companies
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Company not found</h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Link
        href={`/${active.domain}/dashboard/companies`}
        className="text-sm text-muted-foreground hover:underline"
      >
        ← Companies
      </Link>

      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary text-base font-semibold uppercase">
          {company.name[0]?.toUpperCase() ?? "?"}
        </span>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.industry ?? "—"}
            {company.domain ? ` · ${company.domain}` : ""}
          </p>
        </div>
        <Badge
          variant={
            company.status === "customer"
              ? "default"
              : company.status === "lost"
                ? "outline"
                : "secondary"
          }
          className="ml-auto"
        >
          {PROSPECT_LABELS[company.status]}
        </Badge>
      </div>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Industry" value={company.industry ?? ""} />
            <Field label="Size" value={company.size ?? ""} />
            <Field label="Country" value={company.country ?? ""} />
            <Field label="City" value={company.city ?? ""} />
            <Field label="Address" value={company.address ?? ""} full />
            <Field label="Email" value={company.email ?? ""} />
            <Field
              label="Phone numbers"
              value={
                company.phone_numbers && company.phone_numbers.length > 0
                  ? company.phone_numbers.join(", ")
                  : ""
              }
              full
            />
            <Field
              label="Tier"
              value={company.tier_label ?? company.tier ?? ""}
            />
            <Field
              label="Verified"
              value={company.verified ? "Yes" : "No"}
            />
            <Field
              label="Total listings"
              value={company.total_listings?.toString() ?? ""}
            />
          </dl>
        </CardContent>
      </Card>

      {company.about ? (
        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-line text-sm">{company.about}</p>
          </CardContent>
        </Card>
      ) : null}

      {company.social_links && company.social_links.length > 0 ? (
        <Card className="rounded-xl border bg-card">
          <CardHeader>
            <CardTitle>Social</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {company.social_links.map((link, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    {link.name ?? "link"}:
                  </span>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-primary hover:underline"
                  >
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  full,
}: {
  label: string;
  value: string;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-medium">
        {value || <span className="text-muted-foreground">—</span>}
      </dd>
    </div>
  );
}