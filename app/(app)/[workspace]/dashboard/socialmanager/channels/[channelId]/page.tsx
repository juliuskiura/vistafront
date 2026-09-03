import { requireWorkspace } from "@/lib/auth/server";
import { listPages, listPosts, listPlatforms } from "@/lib/api";
import { ChannelDetailClient } from "./channel-detail-client";

/**
 * Channel Detail (Server Component).
 *
 * Shows a single managed channel's posts, stats, and health.
 */
export default async function ChannelDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; channelId: string }>;
}) {
  const { workspace: slug, channelId } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [pages, posts, platforms] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listPosts({ managed_page: channelId, workspace: ws }).catch(() => []),
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
  ]);

  const channel = pages.find((p) => p.nanoid === channelId) ?? null;

  return (
    <ChannelDetailClient
      channel={channel}
      posts={posts}
      platforms={platforms}
      allPages={pages}
      workspaceDomain={ws}
      channelId={channelId}
    />
  );
}
