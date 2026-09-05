import { serverFetch, serverMutate } from "./server-fetch";
import type { RequestOptions } from "./server-fetch-types";
import type {
  Company,
  CompanyStatusBreakdown,
  Contact,
  Country,
  CreateCompanyBody,
  Deal,
  Industry,
  Paginated,
  Pipeline,
  TierClassification,
} from "./types";

function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

/**
 * Build the per-call options for ``serverFetch`` so the active workspace is
 * forwarded as the ``X-Workspace`` header. Centralized here so every CRM
 * call forwards the header in the same shape. The CRM endpoints are
 * tenant-scoped, so ``workspace`` is required.
 */
function wsOpts(workspace: string): RequestOptions {
  return { workspace };
}

/* ──────────────────────────────────────────────────────────────────────
 * Contacts
 * ────────────────────────────────────────────────────────────────────── */

export async function listContacts(
  opts: { company?: string; workspace: string },
): Promise<Contact[]> {
  const qs = opts?.company ? `?company=${encodeURIComponent(opts.company)}` : "";
  const payload = await serverFetch<Contact[] | Paginated<Contact>>(
    `/apis/crm/contacts/${qs}`,
    wsOpts(opts.workspace),
  );
  return unwrap(payload);
}

export function getContact(nanoid: string, workspace: string): Promise<Contact> {
  return serverFetch<Contact>(
    `/apis/crm/contacts/${nanoid}/`,
    wsOpts(workspace),
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Companies
 * ────────────────────────────────────────────────────────────────────── */

export interface ListCompaniesFilters {
  search?: string;
  status?: string;
  industry?: string;
  size?: string;
  tier?: string;
  has_contacts?: boolean;
  verified?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
}

export async function listCompanies(opts: {
  filters?: ListCompaniesFilters;
  workspace: string;
}): Promise<Company[]> {
  const f = opts?.filters ?? {};
  const params = new URLSearchParams();
  if (f.search) params.set("search", f.search);
  if (f.status) params.set("status", f.status);
  if (f.industry) params.set("industry", f.industry);
  if (f.size) params.set("size", f.size);
  if (f.tier) params.set("tier", f.tier);
  if (typeof f.has_contacts === "boolean") {
    params.set("has_contacts", String(f.has_contacts));
  }
  if (typeof f.verified === "boolean") {
    params.set("verified", String(f.verified));
  }
  if (f.ordering) params.set("ordering", f.ordering);
  if (f.page) params.set("page", String(f.page));
  if (f.page_size) params.set("page_size", String(f.page_size));
  const qs = params.toString();
  const payload = await serverFetch<Company[] | Paginated<Company>>(
    `/apis/crm/companies/${qs ? `?${qs}` : ""}`,
    wsOpts(opts.workspace),
  );
  return unwrap(payload);
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
  const f = opts?.filters ?? {};
  const params = new URLSearchParams();
  if (f.search) params.set("search", f.search);
  if (f.status) params.set("status", f.status);
  if (f.industry) params.set("industry", f.industry);
  if (f.size) params.set("size", f.size);
  if (f.tier) params.set("tier", f.tier);
  if (typeof f.has_contacts === "boolean") {
    params.set("has_contacts", String(f.has_contacts));
  }
  if (typeof f.verified === "boolean") {
    params.set("verified", String(f.verified));
  }
  if (f.ordering) params.set("ordering", f.ordering);
  if (f.page) params.set("page", String(f.page));
  if (f.page_size) params.set("page_size", String(f.page_size));
  const qs = params.toString();
  return serverFetch<Paginated<Company>>(
    `/apis/crm/companies/${qs ? `?${qs}` : ""}`,
    wsOpts(opts.workspace),
  );
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

export function deleteCompany(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/crm/companies/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/**
 * Accurate company counts per ``ProspectStatus``. Honours the same filters
 * as `listCompanies` except ``status`` itself, so the board cards stay
 * stable while the user filters the list.
 */
export async function getCompanyStatusBreakdown(opts: {
  filters?: Omit<ListCompaniesFilters, "status" | "ordering" | "page" | "page_size">;
  workspace: string;
}): Promise<CompanyStatusBreakdown> {
  const f = opts?.filters ?? {};
  const params = new URLSearchParams();
  if (f.search) params.set("search", f.search);
  if (f.industry) params.set("industry", f.industry);
  if (f.size) params.set("size", f.size);
  if (f.tier) params.set("tier", f.tier);
  if (typeof f.has_contacts === "boolean") {
    params.set("has_contacts", String(f.has_contacts));
  }
  if (typeof f.verified === "boolean") {
    params.set("verified", String(f.verified));
  }
  const qs = params.toString();
  return serverFetch<CompanyStatusBreakdown>(
    `/apis/crm/companies/status_breakdown/${qs ? `?${qs}` : ""}`,
    wsOpts(opts.workspace),
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Pipelines & Deals
 * ────────────────────────────────────────────────────────────────────── */

export async function listPipelines(workspace: string): Promise<Pipeline[]> {
  const payload = await serverFetch<Pipeline[] | Paginated<Pipeline>>(
    "/apis/crm/pipelines/",
    wsOpts(workspace),
  );
  return unwrap(payload);
}

export function getPipeline(nanoid: string, workspace: string): Promise<Pipeline> {
  return serverFetch<Pipeline>(
    `/apis/crm/pipelines/${nanoid}/`,
    wsOpts(workspace),
  );
}

export async function listDeals(opts: {
  pipeline?: string;
  stage?: string;
  workspace: string;
}): Promise<Deal[]> {
  const params = new URLSearchParams();
  if (opts?.pipeline) params.set("pipeline", opts.pipeline);
  if (opts?.stage) params.set("stage", opts.stage);
  const qs = params.toString();
  const payload = await serverFetch<Deal[] | Paginated<Deal>>(
    `/apis/crm/deals/${qs ? `?${qs}` : ""}`,
    wsOpts(opts.workspace),
  );
  return unwrap(payload);
}

export function getDeal(nanoid: string, workspace: string): Promise<Deal> {
  return serverFetch<Deal>(`/apis/crm/deals/${nanoid}/`, wsOpts(workspace));
}

/* ──────────────────────────────────────────────────────────────────────
 * Reference data
 * ────────────────────────────────────────────────────────────────────── */

export function listCountries(workspace: string): Promise<Country[]> {
  return serverFetch<Country[]>("/apis/crm/countries/", wsOpts(workspace));
}

export async function listIndustries(workspace: string): Promise<Industry[]> {
  const payload = await serverFetch<Industry[] | Paginated<Industry>>(
    "/apis/crm/industries/",
    wsOpts(workspace),
  );
  return unwrap(payload);
}

export async function listTierClassifications(
  workspace: string,
): Promise<TierClassification[]> {
  const payload = await serverFetch<
    TierClassification[] | Paginated<TierClassification>
  >("/apis/crm/tier-classifications/", wsOpts(workspace));
  return unwrap(payload);
}

export function createTierClassification(
  body: { title?: string; label?: string; description?: Record<string, unknown> },
  workspace: string,
): Promise<TierClassification> {
  return serverMutate<TierClassification>("/apis/crm/tier-classifications/", {
    body,
    workspace,
  });
}