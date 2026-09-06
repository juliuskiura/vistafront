import { requireWorkspace } from "@/lib/auth/server";
import { getPost, listPostComments, listMetrics } from "@/lib/api";
import { PostDetailClient } from "./post-detail-client";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; postId: string }>;
}) {
  const { workspace: slug, postId } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const [post, comments, metrics] = await Promise.all([
    getPost(postId, ws).catch(() => null),
    listPostComments({ postNanoid: postId, workspace: ws }).catch(() => []),
    listMetrics({ since: undefined, until: undefined, workspace: ws, managed_page: undefined, metric: undefined }).catch(() => []),
  ]);

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
      metrics={metrics}
      workspaceDomain={ws}
    />
  );
}
