import {
  getCompanyStatusBreakdown,
  listCountries,
  listIndustries,
  listTierClassifications,
  paginatedListCompanies,
  type Company,
  type CompanyStatusBreakdown,
  type Country,
  type Industry,
  type Paginated,
  type TierClassification,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { CrmInnerNav } from "@/components/crm";
import { CompaniesList } from "@/app/(app)/[workspace]/dashboard/companies/companies-list";
import {
  BOARD_STATUSES,
  COMPANY_PAGE_SIZES,
  type CompanyPageSize,
} from "@/lib/crm/constants";
import type {
  CompanyArchiveFilter,
  CompanyFilters,
} from "@/app/(app)/[workspace]/dashboard/companies/_components/companies-filter-bar";

const ALLOWED_PAGE_SIZES = [25, 50, 75, 100] as const;

function parseStatus(raw: string | undefined): string {
  if (!raw) return "";
  // The backend accepts a comma-separated list of statuses; unknown values
  // are dropped rather than passed through, so a hand-edited URL cannot ask
  // for a stage that does not exist.
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => (BOARD_STATUSES as string[]).includes(s))
    .join(",");
}

/**
 * Parse the archive filter.
 *
 * `""` keeps the default (active companies only), `"all"` shows the
 * archived ones alongside the active ones, `"true"` shows only the archived
 * ones. Anything else falls back to the default.
 */
function parseArchived(raw: string | undefined): CompanyArchiveFilter {
  const value = (raw ?? "").trim();
  return value === "all" || value === "true" ? value : "";
}

function parseBool(raw: string | undefined): boolean | null {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function parsePageSize(raw: string | undefined): CompanyPageSize {
  const n = Number(raw);
  return (ALLOWED_PAGE_SIZES as readonly number[]).includes(n)
    ? (n as CompanyPageSize)
    : 25;
}

function parsePage(raw: string | undefined): number {
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * Companies / Prospecting list (Server Component).
 *
 * Reads filters from `searchParams`, fetches the active workspace, the
 * paginated list of companies matching the filters, the per-status
 * breakdown, plus reference data (industries, tier classifications,
 * countries). Everything is fetched with `X-Workspace` so the tenant-scoped
 * CRM endpoints return the right slice.
 *
 * The interactive bits (filter chips, status board, Add Company dialog,
 * table column toggle + bulk actions, rows-per-page + pagination) live in
 * the Client Component subtree so the bulk of the UI stays
 * server-rendered.
 */
export default async function CompaniesListPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{
    search?: string;
    status?: string;
    size?: string;
    industry?: string;
    tier?: string;
    country?: string;
    city?: string;
    has_contacts?: string;
    verified?: string;
    archived?: string;
    ordering?: string;
    page?: string;
    page_size?: string;
  }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);

  const filters: CompanyFilters = {
    search: (sp.search ?? "").trim(),
    status: parseStatus(sp.status),
    size: (sp.size ?? "").trim(),
    industry: (sp.industry ?? "").trim(),
    tier: (sp.tier ?? "").trim(),
    country: (sp.country ?? "").trim(),
    city: (sp.city ?? "").trim(),
    hasContacts: parseBool(sp.has_contacts),
    verified: parseBool(sp.verified),
    archived: parseArchived(sp.archived),
  };

  const orderingStr = (sp.ordering ?? "").trim() || undefined;
  const page = parsePage(sp.page);
  const pageSize = parsePageSize(sp.page_size);

  const listFilters = {
    search: filters.search || undefined,
    status: filters.status || undefined,
    size: filters.size || undefined,
    industry: filters.industry || undefined,
    tier: filters.tier || undefined,
    country: filters.country || undefined,
    city: filters.city || undefined,
    has_contacts: filters.hasContacts ?? undefined,
    verified: filters.verified ?? undefined,
    archived: filters.archived || undefined,
    ordering: orderingStr,
    page,
    page_size: pageSize,
  };

  // The breakdown honours every filter *except* the status itself, so the
  // stage cards keep showing the full picture while the list is narrowed.
  const breakdownFilters = {
    search: listFilters.search,
    industry: listFilters.industry,
    size: listFilters.size,
    tier: listFilters.tier,
    country: listFilters.country,
    city: listFilters.city,
    has_contacts: listFilters.has_contacts,
    verified: listFilters.verified,
    archived: listFilters.archived,
  };

  const [companiesPayload, breakdown, industries, tierClassifications, countries] =
    await Promise.all([
      paginatedListCompanies({
        filters: listFilters,
        workspace: active.domain,
      }).catch(
        () => ({ count: 0, next: null, previous: null, results: [] }) as Paginated<Company>,
      ),
      getCompanyStatusBreakdown({
        filters: breakdownFilters,
        workspace: active.domain,
      }).catch(
        () => ({ total: 0, counts: {} }) as CompanyStatusBreakdown,
      ),
      listIndustries(active.domain).catch(() => [] as Industry[]),
      listTierClassifications(active.domain).catch(
        () => [] as TierClassification[],
      ),
      listCountries(active.domain).catch(() => [] as Country[]),
    ]);

  const companies = companiesPayload.results ?? [];
  const totalCount = companiesPayload.count ?? companies.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = Boolean(companiesPayload.next);
  const hasPrevious = Boolean(companiesPayload.previous);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Prospecting"
        description="Every company you are working, from first identification to a closed deal."
      />
      <CrmInnerNav workspaceDomain={active.domain} />
      <div className="mt-6 flex-1 space-y-6">
        <CompaniesList
          workspace={{
            nanoid: active.nanoid,
            name: active.name,
            domain: active.domain,
          }}
          companies={companies}
          breakdown={breakdown}
          industries={industries}
          tierClassifications={tierClassifications}
          countries={countries}
          filters={filters}
          ordering={orderingStr}
          pagination={{
            page,
            pageSize,
            totalCount,
            totalPages,
            hasNext,
            hasPrevious,
          }}
        />
      </div>
    </div>
  );
}
