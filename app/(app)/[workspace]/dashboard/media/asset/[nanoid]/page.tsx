import { getAsset, getAssetVersions, type Asset, type AssetVersion } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { HydrationBoundary, QueryClient, dehydrate } from "@tanstack/react-query";
import { AssetDetailClient } from "./asset-detail-client";

export default async function MediaAssetDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; nanoid: string }>;
}) {
  const { workspace: slug, nanoid } = await params;
  const active = await requireWorkspace(slug);

  const [asset, versions] = await Promise.all([
    getAsset(nanoid, active.domain).catch(() => null as Asset | null),
    getAssetVersions(nanoid, active.domain).catch(() => [] as AssetVersion[]),
  ]);

  if (!asset) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-lg font-medium">Asset not found</p>
        <p className="text-sm text-muted-foreground">The asset you are looking for does not exist or has been deleted.</p>
      </div>
    );
  }

  // Prefetch the same asset the video studio polls, so the first paint
  // ships with data and hydration doesn't show a blank/errant source.
  const qc = new QueryClient();
  await qc.prefetchQuery({
    queryKey: ["asset", "video-studio", nanoid, active.domain],
    queryFn: () => getAsset(nanoid, active.domain),
  });

  return (
    <HydrationBoundary state={dehydrate(qc)}>
      <AssetDetailClient
        workspaceDomain={active.domain}
        asset={asset}
        versions={versions}
      />
    </HydrationBoundary>
  );
}
