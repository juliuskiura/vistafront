import { serverFetch, serverMutate } from "../server-fetch";
import type { Observation, ObservationCategory } from "../types";
import { fetchList, qs, wsOpts, type ArchivedFilter } from "./shared";

/**
 * List observations.
 *
 * The backend caches this response for 120 seconds, keyed per workspace,
 * user and role. The cache is invalidated when an observation is created or
 * deleted, so a save is reflected immediately — the staleness window only
 * matters for rows created by *another* user.
 *
 * Archived observations (archived with their company) are left out unless
 * `archived: "all"` asks for them.
 */
export async function listObservations(opts: {
  company?: string;
  archived?: ArchivedFilter;
  workspace: string;
}): Promise<Observation[]> {
  return fetchList<Observation>(
    `/apis/crm/observations/${qs({
      company: opts.company,
      archived: opts.archived,
    })}`,
    opts.workspace,
  );
}

export interface CreateObservationBody {
  /** Company nanoid — required. */
  company: string;
  /** Observation-category nanoid — required. */
  category: string;
  title: string;
  description?: string;
  severity?: number;
  opportunity?: string;
  content?: Record<string, unknown>;
}

export function createObservation(
  body: CreateObservationBody,
  workspace: string,
): Promise<Observation> {
  return serverMutate<Observation>("/apis/crm/observations/", {
    body,
    workspace,
  });
}

export function updateObservation(
  nanoid: string,
  body: Partial<CreateObservationBody>,
  workspace: string,
): Promise<Observation> {
  return serverMutate<Observation>(`/apis/crm/observations/${nanoid}/`, {
    method: "PATCH",
    body,
    workspace,
  });
}

export function deleteObservation(
  nanoid: string,
  workspace: string,
): Promise<void> {
  return serverMutate<void>(`/apis/crm/observations/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

/** The categories an observation can be filed under. */
export async function listObservationCategories(
  workspace: string,
): Promise<ObservationCategory[]> {
  return fetchList<ObservationCategory>(
    "/apis/crm/observation-categories/",
    workspace,
  );
}

/**
 * Create an observation category.
 *
 * The endpoint is a plain CRUD viewset, so this works — but the categories
 * are tenant-scoped, and an empty list on a fresh workspace means the tab
 * falls back to free text.
 */
export function createObservationCategory(
  body: { name: string; description?: string },
  workspace: string,
): Promise<ObservationCategory> {
  return serverMutate<ObservationCategory>(
    "/apis/crm/observation-categories/",
    { body, workspace },
  );
}
