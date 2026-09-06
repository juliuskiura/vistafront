import { requireWorkspace } from "@/lib/auth/server";
import { listPages, listPosts, listPlatforms, listAccounts } from "@/lib/api";
import type { SocialAccount } from "@/lib/api/types";
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

  const [pages, posts, platforms, accounts] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listPosts({ managed_page: channelId, workspace: ws }).catch(() => []),
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
    listAccounts(ws).catch((): SocialAccount[] => []),
  ]);

  const channel = pages.find((p) => p.nanoid === channelId) ?? null;

  const pageToAccountNanoid = pages.reduce<Record<string, string>>((map, page) => {
    const account = accounts.find((a) => a.managed_pages?.some((p) => p.nanoid === page.nanoid));
    if (account) map[page.nanoid] = account.nanoid;
    return map;
  }, {});

  return (
    <ChannelDetailClient
      channel={channel}
      posts={posts}
      platforms={platforms}
      allPages={pages}
      workspaceDomain={ws}
      channelId={channelId}
      pageToAccountNanoid={pageToAccountNanoid}
    />
  );
}
