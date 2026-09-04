import { requireWorkspace } from "@/lib/auth/server";
import { MediaUploadCenterClient } from "./media-upload-center-client";

export default async function MediaUploadPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <MediaUploadCenterClient workspaceDomain={active.domain} />
  );
}
