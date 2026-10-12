/** Loading state for the feed list — three card-shaped placeholders.
 *
 *  Deliberately the same rhythm as a real card (avatar + caption line + media
 *  block + footer row) so the transition to real content does not jump. */
export function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the unified feed…</span>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-xs"
        >
          <div className="flex items-center gap-3">
            <div className="size-11 animate-pulse rounded-full bg-neutral-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-neutral-100" />
              <div className="h-2.5 w-20 animate-pulse rounded bg-neutral-100" />
            </div>
            <div className="h-6 w-20 animate-pulse rounded-full bg-neutral-100" />
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-full animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-100" />
          </div>
          <div className="mt-4 h-40 animate-pulse rounded-xl bg-neutral-100" />
          <div className="mt-4 flex gap-4">
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-neutral-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
