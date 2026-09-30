"use client";

import { useCallback, useMemo, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  DEFAULT_NOTE_VIEW,
  parseNoteView,
  type NoteView,
} from "../action-state";

/**
 * The single owner of every piece of Notebook list state that lives in the
 * URL: search, type, archived, page, page size, ordering, and the
 * grid/rows view mode.
 *
 * Why one hook instead of each control building its own query string: the
 * list has eight independent state values, and the previous implementation
 * rebuilt `URLSearchParams` from scratch in two places. That silently
 * dropped anything the second site did not know about — adding `view` or
 * `page` would have reset the search box on every navigation. Here every
 * control goes through one `setParams`, so parameters can only ever be
 * merged, never forgotten.
 *
 * View mode is read from the URL rather than `localStorage` so it survives a
 * reload and can be linked to. Because the Server Component parses `view`
 * before first paint, there is no hydration mismatch.
 */
export interface NotebookFilters {
  search: string;
  noteType: string;
  archived: boolean;
  ordering: string;
}

export interface NotebookViewState {
  filters: NotebookFilters;
  view: NoteView;
  page: number;
  pageSize: number;
  /** True while a `router.push` from this hook is in flight. */
  pending: boolean;
  /**
   * Merge into the current query string and navigate.
   *
   * Pass `undefined` to leave a parameter untouched; pass `null` or `""` to
   * remove it. Any value other than `page` resets to page 1 — filtering to a
   * narrower set while sitting on page 9 would otherwise land the user on an
   * out-of-range page and show an empty grid.
   */
  setParams: (
    updates: Record<string, string | number | boolean | null | undefined>,
    opts?: { keepPage?: boolean },
  ) => void;
}

export function useNotebookViewState(): NotebookViewState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const filters = useMemo<NotebookFilters>(
    () => ({
      search: searchParams.get("search") ?? "",
      noteType: searchParams.get("note_type") ?? "",
      archived: searchParams.get("archived") === "true",
      ordering: searchParams.get("ordering") ?? "-updated_at",
    }),
    [searchParams],
  );

  const view = parseNoteView(searchParams.get("view") ?? undefined);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Number(searchParams.get("page_size") ?? "25") || 25;

  const setParams = useCallback<NotebookViewState["setParams"]>(
    (updates, opts) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined) continue;
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      // Canonical URLs: omit defaults so a shared link stays short and
      // `/notebook` with no params is always the unfiltered first page.
      if (params.get("page") === "1") params.delete("page");
      if (params.get("page_size") === "25") params.delete("page_size");
      if (params.get("ordering") === "-updated_at") params.delete("ordering");
      if (params.get("view") === DEFAULT_NOTE_VIEW) params.delete("view");

      if (!opts?.keepPage) params.delete("page");

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [pathname, router, searchParams],
  );

  return { filters, view, page, pageSize, pending, setParams };
}
