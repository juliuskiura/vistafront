import { serverFetch, serverMutate } from "../server-fetch";
import type { Lead } from "../types";
import { fetchList, qs, wsOpts } from "./shared";

/**
 * List leads.
 *
 * `?company=` is the only filter the backend supports; there is no `?search=`.
 * The lead serializer is not reduced, so `company_name` and `contact_name`
 * are always present.
 */
export async function listLeads(opts: {
  company?: string;
  workspace: string;
}): Promise<Lead[]> {
  return fetchList<Lead>(`/apis/crm/leads/${qs({ company: opts.company })}`, opts.workspace);
}

export interface CreateLeadBody {
  /** Company nanoid — required. */
  company: string;
  /** Optional contact nanoid. */
  contact?: string | null;
  source: string;
  status: string;
  notes?: string;
}

export function createLead(
  body: CreateLeadBody,
  workspace: string,
): Promise<Lead> {
  return serverMutate<Lead>("/apis/crm/leads/", { body, workspace });
}

export function updateLead(
  nanoid: string,
  body: Partial<CreateLeadBody>,
  workspace: string,
): Promise<Lead> {
  return serverMutate<Lead>(`/apis/crm/leads/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteLead(nanoid: string, workspace: string): Promise<void> {
  return serverMutate<void>(`/apis/crm/leads/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

export function getLead(nanoid: string, workspace: string): Promise<Lead> {
  return serverFetch<Lead>(`/apis/crm/leads/${nanoid}/`, wsOpts(workspace));
}
