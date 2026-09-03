import Link from "next/link";

import { listCompanies, type Company, type ProspectStatus } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

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
 * Companies list (Server Component).
 *
 * Server-side search via `searchParams.search` and `searchParams.status`.
 * Filtering is done client-of-the-backend (after `listCompanies`) so the
 * shape stays a flat array; switch to query params when the API supports
 * them directly.
 */
export default async function CompaniesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ search?: string; status?: ProspectStatus }>;
}) {
  const { workspace: slug } = await params;
  const { search, status } = await searchParams;
  const active = await requireWorkspace(slug);

  const all = await listCompanies({ workspace: active.domain }).catch(
    () => [] as Company[],
  );

  const q = (search ?? "").trim().toLowerCase();
  const filtered = all.filter((c) => {
    if (status && c.status !== status) return false;
    if (!q) return true;
    return [c.name, c.domain ?? "", c.industry ?? "", c.country ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(q);
  }); 

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Companies</h1>
        <p className="text-sm text-muted-foreground">
          Companies in your CRM for {active.name}.
        </p>
      </div>

      <form className="flex flex-wrap gap-2" method="get">
        <input
          type="search"
          name="search"
          defaultValue={search ?? ""}
          placeholder="Search companies…"
          className="flex h-9 w-full max-w-sm rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
        <select
          name="status"
          defaultValue={status ?? ""}
          className="flex h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        >
          <option value="">All statuses</option>
          {(Object.keys(PROSPECT_LABELS) as ProspectStatus[]).map((s) => (
            <option key={s} value={s}>
              {PROSPECT_LABELS[s]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="inline-flex h-9 items-center justify-center rounded-lg border bg-background px-3 text-sm font-medium shadow-xs hover:bg-accent hover:text-accent-foreground"
        >
          Apply
        </button>
        {(q || status) ? (
          <Link
            href={`/${active.domain}/dashboard/companies`}
            className="inline-flex h-9 items-center text-xs text-muted-foreground hover:underline"
          >
            Clear
          </Link>
        ) : null}
      </form>

      {filtered.length === 0 ? (
        <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          {q || status
            ? "No companies match your filters."
            : "No companies yet. Add one from the CRM."}
        </Card>
      ) : (
        <Card className="divide-y rounded-xl border bg-card">
          {filtered.map((c) => (
            <CompanyRow
              key={c.nanoid}
              company={c}
              workspaceDomain={active.domain}
            />
          ))}
        </Card>
      )}
    </div>
  );
}

function CompanyRow({
  company,
  workspaceDomain,
}: {
  company: Company;
  workspaceDomain: string;
}) {
  return (
    <Link
      href={`/${workspaceDomain}/dashboard/companies/${company.nanoid}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sm font-semibold uppercase">
        {company.name[0]?.toUpperCase() ?? "?"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{company.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {[company.industry, company.country, company.city]
            .filter(Boolean)
            .join(" · ") || "—"}
        </p>
      </div>
      {typeof company.contact_count === "number" ? (
        <span className="text-xs text-muted-foreground">
          {company.contact_count}{" "}
          {company.contact_count === 1 ? "contact" : "contacts"}
        </span>
      ) : null}
      <Badge
        variant={
          company.status === "customer"
            ? "default"
            : company.status === "lost"
              ? "outline"
              : "secondary"
        }
      >
        {PROSPECT_LABELS[company.status]}
      </Badge>
    </Link>
  );
}