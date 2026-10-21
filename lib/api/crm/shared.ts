import { serverFetch } from "../server-fetch";
import type { RequestOptions } from "../server-fetch-types";
import type { Paginated } from "../types";

/**
 * Which archived records a list should show.
 *
 * The backend hides archived records by default — the working lists only
 * show what is live. `"all"` shows both, `"true"` shows only the archived
 * ones, `"false"` is the same as leaving the filter out.
 */
export type ArchivedFilter = "true" | "false" | "all";

/**
 * Build the per-call options for `serverFetch` so the active workspace is
 * forwarded as the `X-Workspace` header. Centralized here so every CRM call
 * forwards the header in the same shape. The CRM endpoints are tenant-scoped,
 * so `workspace` is required — without it Django's tenant middleware falls
 * back to the shared `app` workspace and answers `200 OK` with an empty list.
 */
export function wsOpts(workspace: string): RequestOptions {
  return { workspace };
}

/**
 * Unwrap a list response.
 *
 * Every CRM list endpoint is paginated, so responses come back as
 * `{ count, next, previous, results }`; a couple of endpoints (countries)
 * answer with a bare array. Both are accepted.
 */
export function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

/** Build a query string, skipping empty values. Returns "" when nothing is set. */
export function qs(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const str = search.toString();
  return str ? `?${str}` : "";
}

/** Fetch a list endpoint and unwrap it. */
export async function fetchList<T>(
  path: string,
  workspace: string,
): Promise<T[]> {
  const payload = await serverFetch<T[] | Paginated<T>>(path, wsOpts(workspace));
  return unwrap(payload);
}
