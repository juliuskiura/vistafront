import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { getPost, listPages, listPostComments, listMetrics } from "@/lib/api";
import { PostDetailClient } from "./post-detail-client";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; postId: string }>;
}) {
  const { workspace: slug, postId } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "socialmanager.posts");
  const ws = active.domain;

  // Comments are fetched apart from the rest because "we could not load them" and
  // "this post has none" must not look the same. Coalescing a failure into an
  // empty list renders "No comments yet — Sync comments →", which points the user
  // at a button that cannot fix a broken query.
  const commentsRequest = listPostComments({
    postNanoid: postId,
    workspace: ws,
  })
    .then((comments) => ({ comments, failed: false }))
    .catch(() => ({ comments: [] as Awaited<ReturnType<typeof listPostComments>>, failed: true }));

  const [post, commentsResult, metrics, pages] = await Promise.all([
    getPost(postId, ws).catch(() => null),
    commentsRequest,
    listMetrics({ since: undefined, until: undefined, workspace: ws, managed_page: undefined, metric: undefined }).catch(() => []),
    // A post recipient carries only the page name, so the channel list is what
    // supplies the platform behind each recipient's icon.
    listPages({ workspace: ws }).catch(() => []),
  ]);

  const comments = commentsResult.comments;

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
      comments={comments}
      commentsFailed={commentsResult.failed}
      metrics={metrics}
      pages={pages}
      workspaceDomain={ws}
    />
  );
}
