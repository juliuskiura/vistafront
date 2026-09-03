import {
  getCompanyStatusBreakdown,
  listIndustries,
  listTierClassifications,
  paginatedListCompanies,
  type Company,
  type CompanyStatusBreakdown,
  type Industry,
  type Paginated,
  type ProspectStatus,
  type TierClassification,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { CompaniesList } from "@/app/(app)/[workspace]/dashboard/companies/companies-list";

const VALID_STATUSES: ProspectStatus[] = [
  "identified",
  "researching",
  "contact_ready",
  "outreach_sent",
  "engaged",
  "qualified",
  "customer",
  "lost",
];

const ALLOWED_PAGE_SIZES = [25, 50, 75, 100] as const;
type AllowedPageSize = (typeof ALLOWED_PAGE_SIZES)[number];

function parseStatus(raw: string | undefined): ProspectStatus | null {
  if (!raw) return null;
  return (VALID_STATUSES as string[]).includes(raw)
    ? (raw as ProspectStatus)
    : null;
}

function parseBool(raw: string | undefined): boolean | null {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

function parsePageSize(raw: string | undefined): AllowedPageSize {
  const n = Number(raw);
  return (ALLOWED_PAGE_SIZES as readonly number[]).includes(n)
    ? (n as AllowedPageSize)
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
 * breakdown, plus reference data (industries, tier classifications).
 * Everything is fetched with `X-Workspace` so the tenant-scoped CRM
 * endpoints return the right slice.
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
    has_contacts?: string;
    verified?: string;
    ordering?: string;
    page?: string;
    page_size?: string;
  }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);

  const filters = {
    search: (sp.search ?? "").trim(),
    status: parseStatus(sp.status),
    size: (sp.size ?? "").trim(),
    industry: (sp.industry ?? "").trim(),
    tier: (sp.tier ?? "").trim(),
    hasContacts: parseBool(sp.has_contacts),
    verified: parseBool(sp.verified),
  };

  const orderingStr = (sp.ordering ?? "").trim() || undefined;
  const page = parsePage(sp.page);
  const pageSize = parsePageSize(sp.page_size);

  const listFilters = {
    search: filters.search || undefined,
    status: filters.status ?? undefined,
    size: filters.size || undefined,
    industry: filters.industry || undefined,
    tier: filters.tier || undefined,
    has_contacts: filters.hasContacts ?? undefined,
    verified: filters.verified ?? undefined,
    ordering: orderingStr,
    page,
    page_size: pageSize,
  };

  const breakdownFilters = {
    search: listFilters.search,
    industry: listFilters.industry,
    size: listFilters.size,
    tier: listFilters.tier,
    has_contacts: listFilters.has_contacts,
    verified: listFilters.verified,
  };

  const [companiesPayload, breakdown, industries, tierClassifications] =
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
    ]);

  const companies = companiesPayload.results ?? [];
  const totalCount = companiesPayload.count ?? companies.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNext = Boolean(companiesPayload.next);
  const hasPrevious = Boolean(companiesPayload.previous);

  return (
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
  );
}