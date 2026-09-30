/**
 * Skeleton for the Notebook list.
 *
 * Shaped like the card grid rather than a generic spinner, so the layout does
 * not jump when the real page arrives. Because the page is a Server
 * Component that fetches before it renders, this is what the user sees
 * during the navigation round trip.
 */
export default function NotebookLoading() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Banner placeholder */}
      <div className="-mx-4 -mt-4 h-[132px] animate-pulse bg-gradient-to-r from-primary-600/70 to-secondary-600/70 md:-mx-6 md:-mt-6" />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-5 pt-6">
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className="h-7 w-24 animate-pulse rounded-full bg-muted"
            />
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <div className="h-8 min-w-[200px] flex-1 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <div
              key={i}
              className="min-h-[172px] animate-pulse border-t border-[var(--nb-rule)] px-1 pb-5 pl-5 pt-4"
            >
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="mt-3 h-3 w-full rounded bg-muted/70" />
              <div className="mt-1.5 h-3 w-4/5 rounded bg-muted/70" />
              <div className="mt-4 h-5 w-24 rounded-full bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
