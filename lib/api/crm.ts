import "server-only";

import { serverFetch } from "./server-fetch";
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

/* ──────────────────────────────────────────────────────────────────────
 * Contacts
 * ────────────────────────────────────────────────────────────────────── */

export async function listContacts(
  opts?: { company?: string },
): Promise<Contact[]> {
  const qs = opts?.company ? `?company=${encodeURIComponent(opts.company)}` : "";
  const payload = await serverFetch<Contact[] | Paginated<Contact>>(
    `/apis/crm/contacts/${qs}`,
  );
  return unwrap(payload);
}

export function getContact(nanoid: string): Promise<Contact> {
  return serverFetch<Contact>(`/apis/crm/contacts/${nanoid}/`);
}

/* ──────────────────────────────────────────────────────────────────────
 * Companies
 * ────────────────────────────────────────────────────────────────────── */

export async function listCompanies(opts?: {
  search?: string;
  status?: string;
  industry?: string;
}): Promise<Company[]> {
  const params = new URLSearchParams();
  if (opts?.search) params.set("search", opts.search);
  if (opts?.status) params.set("status", opts.status);
  if (opts?.industry) params.set("industry", opts.industry);
  const qs = params.toString();
  const payload = await serverFetch<Company[] | Paginated<Company>>(
    `/apis/crm/companies/${qs ? `?${qs}` : ""}`,
  );
  return unwrap(payload);
}

export function getCompany(nanoid: string): Promise<Company> {
  return serverFetch<Company>(`/apis/crm/companies/${nanoid}/`);
}

/* ──────────────────────────────────────────────────────────────────────
 * Pipelines & Deals
 * ────────────────────────────────────────────────────────────────────── */

export async function listPipelines(): Promise<Pipeline[]> {
  const payload = await serverFetch<Pipeline[] | Paginated<Pipeline>>(
    "/apis/crm/pipelines/",
  );
  return unwrap(payload);
}

export function getPipeline(nanoid: string): Promise<Pipeline> {
  return serverFetch<Pipeline>(`/apis/crm/pipelines/${nanoid}/`);
}

export async function listDeals(opts?: {
  pipeline?: string;
  stage?: string;
}): Promise<Deal[]> {
  const params = new URLSearchParams();
  if (opts?.pipeline) params.set("pipeline", opts.pipeline);
  if (opts?.stage) params.set("stage", opts.stage);
  const qs = params.toString();
  const payload = await serverFetch<Deal[] | Paginated<Deal>>(
    `/apis/crm/deals/${qs ? `?${qs}` : ""}`,
  );
  return unwrap(payload);
}

export function getDeal(nanoid: string): Promise<Deal> {
  return serverFetch<Deal>(`/apis/crm/deals/${nanoid}/`);
}

/* ──────────────────────────────────────────────────────────────────────
 * Reference data
 * ────────────────────────────────────────────────────────────────────── */

export function listCountries(): Promise<Country[]> {
  return serverFetch<Country[]>("/apis/crm/countries/");
}