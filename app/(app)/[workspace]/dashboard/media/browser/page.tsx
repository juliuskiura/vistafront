import {
  getAssets,
  type Asset,
  type AssetType,
  type PaginatedAssets,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { BrowserClient } from "./browser-client";

export default async function MediaBrowserPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{
    text?: string;
    asset_type?: string;
    tags?: string;
    folder?: string;
    collection?: string;
    page?: string;
    page_size?: string;
  }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);

  const page = Number(sp.page ?? "1");
  const pageSize = Number(sp.page_size ?? "24");

  const assetsPayload = await getAssets({
    workspace: active.domain,
    params: {
      text: sp.text,
      asset_type: (sp.asset_type as AssetType | undefined) || undefined,
      folder: sp.folder,
      collection: sp.collection,
    },
    page,
    page_size: pageSize,
  }).catch(() => ({
    count: 0,
    next: null,
    previous: null,
    results: [] as Asset[],
  }));

  return (
    <BrowserClient
      workspaceDomain={active.domain}
      initialAssets={assetsPayload}
      initialSearch={sp.text ?? ""}
      initialAssetType={sp.asset_type ?? ""}
      pageSize={pageSize}
    />
  );
}
