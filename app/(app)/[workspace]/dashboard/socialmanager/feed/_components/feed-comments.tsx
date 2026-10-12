"use client";

import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";
import { PostCommentsBody } from "@/components/socialmanager/post-comments-body";

/**
 * One post's audience thread, embedded in its feed card.
 *
 * The thread itself is the shared `PostCommentsBody` — the same component the
 * channel sheet uses — so the Unified Feed cannot offer a different set of
 * moderation controls than the rest of the section, and a fix to one lands in
 * both. This wrapper only frames it and explains the number above it.
 *
 * It owns its own fetching (only mounted while the card's thread is open) and
 * its own socket subscription, so opening a thread costs exactly one request.
 */
export function FeedComments({
  post,
  workspace,
  pagesById,
}: {
  post: ScheduledPost;
  workspace: string;
  pagesById: Record<string, ManagedChannel>;
}) {
  return (
    <div>
      <p className="mb-2 text-[11px] leading-relaxed text-neutral-400">
        The count above is every comment on this post across all channels,
        including private replies — the thread below is what can be acted on.
      </p>
      <PostCommentsBody
        key={post.nanoid}
        post={post}
        workspace={workspace}
        pageById={pagesById}
      />
    </div>
  );
}
