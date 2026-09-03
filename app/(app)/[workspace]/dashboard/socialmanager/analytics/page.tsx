import { requireWorkspace } from "@/lib/auth/server";
import { listPages, listMetrics } from "@/lib/api";
import { AnalyticsClient } from "./analytics-client";

/**
 * Analytics (Server Component).
 * Fetches pages and metric snapshots.
 * The summary cards, sync flow, and snapshots table are Client Components.
 */
export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [pages, metrics] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listMetrics({ workspace: ws }).catch(() => []),
  ]);

  return (
    <AnalyticsClient pages={pages} metrics={metrics} workspaceDomain={ws} />
  );
}
