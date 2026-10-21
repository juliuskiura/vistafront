import type { Paginated } from "@/lib/api/types";

/**
 * Unwrap a list response.
 *
 * Every list endpoint in this Django app is globally paginated
 * (``LivechatPagination``, page size 25), so responses come back as
 * ``{ count, next, previous, results }`` instead of a plain array. Unwrap
 * the ``results`` page defensively: raw arrays pass through, non-array
 * error payloads degrade to an empty list instead of crashing callers.
 */
export function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}
