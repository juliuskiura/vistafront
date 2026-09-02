import { Suspense } from "react";

import { getAuthUser } from "@/lib/auth/server";
import { getDashboardWidgets, ServerFetchError } from "@/lib/api";
import { DashboardWidgets } from "@/components/dashboard/dashboard-widgets";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * Workspace dashboard (Server Component).
 *
 * Streams the dashboard widgets through a Suspense boundary so the shell
 * and sidebar render immediately while the widgets load. Errors from the
 * dashboard API are surfaced as a visible error card (not silently
 * converted into an empty array) so the developer sees what went wrong.
 */
export default function DashboardHomePage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<DashboardHeadingSkeleton />}>
        <DashboardHeading />
      </Suspense>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardWidgetsAsync />
      </Suspense>
    </div>
  );
}

async function DashboardHeading() {
  // requireAuth() is the same call the (app) layout made; we need the user
  // here for the greeting, and re-reading the cookie is cheap. If the user
  // is somehow not authenticated, fall back to a generic greeting rather
  // than redirecting (the layout has already enforced the auth check).
  const user = await getAuthUser().catch(() => null);
  const firstName = user?.first_name?.trim();
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
      </p>
    </div>
  );
}

function DashboardHeadingSkeleton() {
  return (
    <div>
      <div className="h-7 w-32 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-4 w-48 animate-pulse rounded bg-muted" />
    </div>
  );
}

async function DashboardWidgetsAsync() {
  let widgets;
  try {
    widgets = await getDashboardWidgets();
  } catch (error) {
    // Surface the real failure (auth, transport, schema) so we don't
    // silently render the "empty" state when the API actually errored.
    // eslint-disable-next-line no-console
    console.error("getDashboardWidgets failed:", error);
    if (error instanceof ServerFetchError) {
      return (
        <DashboardWidgets
          data={{
            kind: "error",
            title: "Could not load dashboard widgets",
            message: `${error.status} ${error.path}`,
            hint:
              error.status === 401
                ? "Your session may have expired. Try signing in again."
                : error.status === 403
                  ? "Your workspace membership may have changed. Try refreshing."
                  : "Check the server logs for the full response body.",
          }}
        />
      );
    }
    return (
      <DashboardWidgets
        data={{
          kind: "error",
          title: "Could not reach the dashboard service",
          message:
            error instanceof Error ? error.message : "Unknown network error",
          hint: "Is the Django backend running and reachable from this server?",
        }}
      />
    );
  }
  return <DashboardWidgets data={{ kind: "ok", widgets }} />;
}
