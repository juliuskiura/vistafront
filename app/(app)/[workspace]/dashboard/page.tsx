import { Suspense } from "react";

import { getDashboardWidgets } from "@/lib/api";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * Workspace dashboard (Server Component).
 *
 * Fetches dashboard widgets in a Server Component and streams them
 * through React Suspense so the sidebar can render immediately while the
 * widgets load.
 */
export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          A live look at your projects, social channels, and pipeline.
        </p>
      </header>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardWidgetsAsync />
      </Suspense>
    </div>
  );
}

async function DashboardWidgetsAsync() {
  const widgets = await getDashboardWidgets().catch(() => []);
  return <DashboardWidgets widgets={widgets} />;
}
