"use client";

import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
  pending: boolean;
  onPageChange: (page: number) => void;
}

/**
 * The pagination controls.
 *
 * The page number lives in the URL (`?page=`), so the server re-renders the
 * list for the requested page and a shared link opens the same view.
 */
export function CompaniesPagination({
  page,
  totalPages,
  totalCount,
  hasNext,
  hasPrevious,
  pending,
  onPageChange,
}: Props) {
  if (totalCount <= 0) return null;

  const pageButtons = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 || p === totalPages || Math.abs(p - page) <= 2,
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-sm text-muted-foreground">
        Page {page} of {totalPages} · {totalCount} total
      </p>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          disabled={!hasPrevious || pending}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </Button>
        {pageButtons.map((p, idx, arr) => {
          const prev = arr[idx - 1];
          const showEllipsis = prev && p - prev > 1;
          const isCurrent = p === page;
          return (
            <span key={p} className="flex items-center">
              {showEllipsis ? (
                <span className="px-2 text-sm text-muted-foreground">…</span>
              ) : null}
              <Button
                size="sm"
                variant={isCurrent ? "default" : "ghost"}
                disabled={pending}
                onClick={() => onPageChange(p)}
                aria-current={isCurrent ? "page" : undefined}
              >
                {p}
              </Button>
            </span>
          );
        })}
        <Button
          size="sm"
          variant="outline"
          disabled={!hasNext || pending}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
