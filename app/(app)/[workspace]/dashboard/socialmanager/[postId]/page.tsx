import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { getPost, listPages } from "@/lib/api";
import { PostDetailClient } from "./post-detail-client";
import { loadPostMetrics } from "./post-metrics";

/** Post detail page (Server Component).
 *
 * Renders one parent post — the master ScheduledPost — laid out as a single
 * feed card with the always-open comment thread beside the meta panel. All
 * post-scoped data is fetched here so the first paint ships with real content.
 */
export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; postId: string }>;
}) {
  const { workspace: slug, postId } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "socialmanager.posts");
  const ws = active.domain;

  // The metrics have to follow the post: MetricSnapshot is keyed to a page, not
  // to a post, so the channels to ask about are only known once the post is in.
  const [post, pages] = await Promise.all([
    getPost(postId, ws).catch(() => null),
    listPages({ workspace: ws }).catch(() => []),
  ]);

  const metrics = post ? await loadPostMetrics(post, ws) : { snapshots: [], channelNanoids: [], omittedChannels: 0 };

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white p-12 text-center">
        <p className="text-lg font-semibold text-neutral-900">Post not found</p>
        <p className="mt-1 text-sm text-neutral-500">The post you are looking for does not exist or has been removed.</p>
      </div>
    );
  }

  return (
    <PostDetailClient
      post={post}
      metrics={metrics.snapshots}
      metricsChannels={{ nanoids: metrics.channelNanoids, omitted: metrics.omittedChannels }}
      pages={pages}
      workspaceDomain={ws}
    />
  );
}
