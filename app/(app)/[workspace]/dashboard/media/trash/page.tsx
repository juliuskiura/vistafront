import Image from "next/image";
import { requireWorkspace } from "@/lib/auth/server";
import { getTrashedAssets } from "@/lib/api";
import type { Asset } from "@/lib/api";
import { TrashClient } from "./trash-client";

export default async function MediaTrashPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const assets = await getTrashedAssets({ workspace: active.domain, page: 1, page_size: 48 }).catch(() => []);

  return (
    <TrashClient workspaceDomain={active.domain} assets={Array.isArray(assets) ? assets : []} />
  );
}
