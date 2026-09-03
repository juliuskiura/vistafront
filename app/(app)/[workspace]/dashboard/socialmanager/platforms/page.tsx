import { requireWorkspace } from "@/lib/auth/server";
import { listPlatforms, listContentFormats, listConstraints } from "@/lib/api";
import { PlatformConfigClient } from "./platform-config-client";

/**
 * Platform Config (Server Component).
 * Fetches all platform configurations.
 * Interactive editing happens in the Client Component.
 */
export default async function PlatformConfigPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [platforms, contentFormats, constraints] = await Promise.all([
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
    listContentFormats({ all: true, workspace: ws }).catch(() => []),
    listConstraints({ all: true, workspace: ws }).catch(() => []),
  ]);

  return (
    <PlatformConfigClient
      platforms={platforms}
      contentFormats={contentFormats}
      constraints={constraints}
      workspaceDomain={ws}
    />
  );
}
