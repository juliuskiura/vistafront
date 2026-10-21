import { serverFetch, serverMutate } from "../server-fetch";
import type {
  Company,
  CompanyStatusBreakdown,
  CreateCompanyBody,
  Paginated,
} from "../types";
import { fetchList, qs, wsOpts } from "./shared";

export interface ListCompaniesFilters {
  search?: string;
  /**
   * One status, or a comma-separated list — the backend filters on
   * `status__in`, so `status=identified,researching` narrows to those two
   * stages. That is what the "Open stages" quick filter uses.
   */
  status?: string;
  industry?: string;
  size?: string;
  tier?: string;
  has_contacts?: boolean;
  verified?: boolean;
  /** 2-letter country code, matched exactly (case-insensitive). */
  country?: string;
  /** Substring match. */
  city?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
}

function companyListQuery(f: ListCompaniesFilters): string {
  return qs({
    search: f.search,
    status: f.status,
    industry: f.industry,
    size: f.size,
    tier: f.tier,
    has_contacts: typeof f.has_contacts === "boolean" ? String(f.has_contacts) : undefined,
    verified: typeof f.verified === "boolean" ? String(f.verified) : undefined,
    country: f.country,
    city: f.city,
    ordering: f.ordering,
    page: f.page,
    page_size: f.page_size,
  });
}

export async function listCompanies(opts: {
  filters?: ListCompaniesFilters;
  workspace: string;
}): Promise<Company[]> {
  return fetchList<Company>(
    `/apis/crm/companies/${companyListQuery(opts.filters ?? {})}`,
    opts.workspace,
  );
}

/**
 * Variant of {@link listCompanies} that returns the raw paginated envelope
 * (`{ count, next, previous, results }`) so callers can render pagination
 * controls. Use this when the UI needs to know the total row count or
 * whether a next/previous page exists.
 */
export async function paginatedListCompanies(opts: {
  filters?: ListCompaniesFilters;
  workspace: string;
}): Promise<Paginated<Company>> {
  const payload = await serverFetch<Paginated<Company>>(
    `/apis/crm/companies/${companyListQuery(opts.filters ?? {})}`,
    wsOpts(opts.workspace),
  );
  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: Array.isArray(payload?.results) ? payload.results : [],
  };
}

export function getCompany(nanoid: string, workspace: string): Promise<Company> {
  return serverFetch<Company>(
    `/apis/crm/companies/${nanoid}/`,
    wsOpts(workspace),
  );
}

export function createCompany(
  body: CreateCompanyBody,
  workspace: string,
): Promise<Company> {
  return serverMutate<Company>("/apis/crm/companies/", {
    body,
    workspace,
  });
}

/**
 * Patch a company.
 *
 * `body` is sent as-is, so a caller can send a single changed field. The
 * inline editors on the company record do exactly that: one field per save,
 * so a bad value on one field can never overwrite the rest of the record.
 */
export function updateCompany(
  nanoid: string,
  body: Partial<CreateCompanyBody>,
  workspace: string,
): Promise<Company> {
  return serverMutate<Company>(`/apis/crm/companies/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteCompany(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/crm/companies/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/**
 * Move the company one step along the prospecting flow.
 *
 * The endpoint takes no body. It answers `400` with
 * `{ detail: "Company is already at the final prospecting stage." }` at the
 * end of the flow, so the caller must surface that message rather than
 * treating it as a generic failure.
 */
export function advanceCompany(
  nanoid: string,
  workspace: string,
): Promise<Company> {
  return serverMutate<Company>(`/apis/crm/companies/${nanoid}/advance/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

/**
 * Accurate company counts per `ProspectStatus`. Honours the same filters as
 * `listCompanies` except `status` itself, so the board cards stay stable
 * while the user filters the list.
 */
export async function getCompanyStatusBreakdown(opts: {
  filters?: Omit<
    ListCompaniesFilters,
    "status" | "ordering" | "page" | "page_size"
  >;
  workspace: string;
}): Promise<CompanyStatusBreakdown> {
  const f = opts.filters ?? {};
  const payload = await serverFetch<CompanyStatusBreakdown>(
    `/apis/crm/companies/status_breakdown/${qs({
      search: f.search,
      industry: f.industry,
      size: f.size,
      tier: f.tier,
      has_contacts:
        typeof f.has_contacts === "boolean" ? String(f.has_contacts) : undefined,
      verified:
        typeof f.verified === "boolean" ? String(f.verified) : undefined,
      country: f.country,
      city: f.city,
    })}`,
    wsOpts(opts.workspace),
  );
  return { total: payload?.total ?? 0, counts: payload?.counts ?? {} };
}
