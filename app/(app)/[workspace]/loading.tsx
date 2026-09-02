import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * Loading state for the entire `[workspace]` segment.
 *
 * The dashboard uses a finer-grained `<Suspense />` boundary inside its
 * page, but the segment-level `loading.tsx` covers any sibling route
 * (e.g. `/[workspace]/settings`) that takes the same fetching shape.
 */
export default function WorkspaceLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 animate-pulse rounded bg-muted" />
      <DashboardSkeleton />
    </div>
  );
}
