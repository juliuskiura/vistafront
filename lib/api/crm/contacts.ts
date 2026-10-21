import { serverFetch, serverMutate } from "../server-fetch";
import type { Contact } from "../types";
import { fetchList, qs, wsOpts } from "./shared";

/**
 * List contacts.
 *
 * The backend has no `?search=` for contacts — only `?company=`. A search
 * therefore has to happen in memory over the whole set, which is why the
 * contacts page caps what it fetches.
 */
export async function listContacts(opts: {
  company?: string;
  workspace: string;
}): Promise<Contact[]> {
  return fetchList<Contact>(
    `/apis/crm/contacts/${qs({ company: opts.company })}`,
    opts.workspace,
  );
}

export function getContact(nanoid: string, workspace: string): Promise<Contact> {
  return serverFetch<Contact>(
    `/apis/crm/contacts/${nanoid}/`,
    wsOpts(workspace),
  );
}

export interface CreateContactBody {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  /** Company nanoid — required by the backend. */
  company: string;
  notes?: string;
  status?: "active" | "inactive" | "lead";
  social_links?: { url: string; name?: string; is_primary?: boolean }[];
}

export function createContact(
  body: CreateContactBody,
  workspace: string,
): Promise<Contact> {
  return serverMutate<Contact>("/apis/crm/contacts/", {
    body,
    workspace,
  });
}

/** Patch a contact. Send only the changed fields. */
export function updateContact(
  nanoid: string,
  body: Partial<CreateContactBody>,
  workspace: string,
): Promise<Contact> {
  return serverMutate<Contact>(`/apis/crm/contacts/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteContact(
  nanoid: string,
  workspace: string,
): Promise<void> {
  return serverMutate<void>(`/apis/crm/contacts/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}
