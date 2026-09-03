import {
  getMediaStats,
  getAssets,
  type Asset,
  type MediaStats,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { MediaDashboardClient } from "./media-dashboard-client";

export default async function MediaDashboardPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const [stats, recentAssets] = await Promise.all([
    getMediaStats(active.domain).catch(() => null as MediaStats | null),
    getAssets({ workspace: active.domain, page: 1, page_size: 4 }).catch(
      () => ({ count: 0, next: null, previous: null, results: [] as Asset[] }),
    ),
  ]);

  const recent = recentAssets.results ?? [];

  return (
    <MediaDashboardClient
      workspaceDomain={active.domain}
      stats={stats}
      recentAssets={recent}
    />
  );
}