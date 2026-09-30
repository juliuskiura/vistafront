"use client";

import { ChevronLeft, ChevronRight } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { NOTE_PAGE_SIZES } from "../action-state";
import { useNotebookViewState } from "./use-notebook-view-state";

interface NotebookPaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * The list's pagination footer.
 *
 * All state is URL-driven: `page` and `page_size` live in the query string,
 * so a page of results is linkable, survives a reload, and the Server
 * Component re-renders with the correct slice. Changing the page size resets
 * to page 1 — otherwise switching 100 → 25 while on page 4 would leave the
 * user on the last, mostly-empty page.
 *
 * The numbered window shows the first and last page plus ±1 either side of
 * the current page, with an ellipsis for each gap. That keeps the footer a
 * fixed width whether there are 3 pages or 300.
 */
export function NotebookPagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasNext,
  hasPrevious,
}: NotebookPaginationProps) {
  const { setParams, pending } = useNotebookViewState();

  if (totalCount === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalCount);

  const numbers = buildWindow(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-4">
      <p className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{first}</span>–
        <span className="font-medium text-foreground">{last}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span>
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="sr-only sm:not-sr-only">Per page</span>
          <select
            value={pageSize}
            disabled={pending}
            onChange={(e) => setParams({ page_size: e.target.value })}
            className="h-7 rounded-md border border-input bg-background px-1.5 text-xs transition-colors disabled:opacity-50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            {NOTE_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>

        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            size="icon"
            variant="outline"
            className="size-7"
            disabled={!hasPrevious || pending}
            onClick={() => setParams({ page: page - 1 }, { keepPage: true })}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
          </Button>

          {numbers.map((entry, i) =>
            entry === "gap" ? (
              <span
                key={`gap-${i}`}
                aria-hidden="true"
                className="px-1 text-xs text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                size="icon"
                variant={entry === page ? "default" : "ghost"}
                className={cn("size-7 text-xs", entry !== page && "font-normal")}
                disabled={pending}
                onClick={() => setParams({ page: entry }, { keepPage: true })}
                aria-label={`Page ${entry}`}
                aria-current={entry === page ? "page" : undefined}
              >
                {entry}
              </Button>
            ),
          )}

          <Button
            size="icon"
            variant="outline"
            className="size-7"
            disabled={!hasNext || pending}
            onClick={() => setParams({ page: page + 1 }, { keepPage: true })}
            aria-label="Next page"
          >
            <ChevronRight size={14} />
          </Button>
        </nav>
      </div>
    </div>
  );
}

type WindowEntry = number | "gap";

/**
 * First page, last page, and ±1 around the current page, with `"gap"`
 * wherever pages were skipped. `undefined` means the window is dense enough
 * that every page fits.
 */
function buildWindow(page: number, totalPages: number): WindowEntry[] {
  const total = Array.from({ length: totalPages }, (_, i) => i + 1);

  if (total.length <= 7) return total;

  const keep = new Set<number>([
    1,
    totalPages,
    page,
    page - 1,
    page + 1,
  ]);

  const kept = total.filter((p) => keep.has(p));
  const entries: WindowEntry[] = [];

  for (let i = 0; i < kept.length; i += 1) {
    if (i > 0 && kept[i] - kept[i - 1] > 1) entries.push("gap");
    entries.push(kept[i]);
  }

  return entries;
}
