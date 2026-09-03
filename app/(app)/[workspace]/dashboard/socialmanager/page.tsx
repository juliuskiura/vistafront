import { requireWorkspace } from "@/lib/auth/server";
import {
  listPages,
  listPosts,
  listPlatforms,
  listQueues,
} from "@/lib/api";
import { SocialHomePageClient } from "./social-home-client";

/**
 * Social Manager home (Server Component).
 *
 * Fetches all social data on the server and passes it to the interactive
 * client component. The sync flow, post table, and comments sheet are
 * client-side because they require polling and modals.
 */
export default async function SocialHomePage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [pages, posts, platforms, queues] = await Promise.all([
    listPages({ workspace: ws }).catch(() => []),
    listPosts({ workspace: ws }).catch(() => []),
    listPlatforms({ all: true, workspace: ws }).catch(() => []),
    listQueues(ws).catch(() => []),
  ]);

  return (
    <SocialHomePageClient
      pages={pages}
      posts={posts}
      platforms={platforms}
      queues={queues}
      workspaceDomain={ws}
    />
  );
}
