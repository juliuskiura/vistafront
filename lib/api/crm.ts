import "server-only";

import { serverFetch, type RequestOptions } from "./server-fetch";
import type {
  Company,
  Contact,
  Country,
  Deal,
  Paginated,
  Pipeline,
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

export async function listCompanies(opts: {
  search?: string;
  status?: string;
  industry?: string;
  workspace: string;
}): Promise<Company[]> {
  const params = new URLSearchParams();
  if (opts?.search) params.set("search", opts.search);
  if (opts?.status) params.set("status", opts.status);
  if (opts?.industry) params.set("industry", opts.industry);
  const qs = params.toString();
  const payload = await serverFetch<Company[] | Paginated<Company>>(
    `/apis/crm/companies/${qs ? `?${qs}` : ""}`,
    wsOpts(opts.workspace),
  );
  return unwrap(payload);
}

export function getCompany(nanoid: string, workspace: string): Promise<Company> {
  return serverFetch<Company>(
    `/apis/crm/companies/${nanoid}/`,
    wsOpts(workspace),
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