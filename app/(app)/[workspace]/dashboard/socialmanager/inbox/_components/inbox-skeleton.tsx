/**
 * Fallback for the `Suspense` boundary around the inbox island.
 *
 * Mirrors the two-pane geometry the real client renders so the layout does not
 * jump when the island takes over.
 */
export function InboxSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr] lg:h-[calc(100vh-16rem)]">
      <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 p-3">
          <div className="h-9 w-full animate-pulse rounded-lg bg-gray-100" />
        </div>
        <ul className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="flex items-start gap-3 px-4 py-3">
              <div className="size-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-100" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="hidden min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white lg:flex">
        <div className="space-y-3 p-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={
                index % 2 === 0
                  ? "h-12 w-1/2 animate-pulse rounded-2xl bg-gray-100"
                  : "ml-auto h-12 w-1/2 animate-pulse rounded-2xl bg-gray-100"
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}
