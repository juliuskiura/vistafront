import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { MediaUploadCenterClient } from "./media-upload-center-client";

export default async function MediaUploadPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "media_libary.assets");

  return (
    <MediaUploadCenterClient workspaceDomain={active.domain} />
  );
}
