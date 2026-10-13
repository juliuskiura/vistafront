"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, Users } from "@/lib/icons";

import type { ManagedChannel, PostComment, ScheduledPost } from "@/lib/api/types";
import {
  getPostsSyncStatusAction,
  listPostCommentsAction,
  syncCommentsAction,
} from "@/app/(app)/[workspace]/dashboard/socialmanager/actions";
import { Button } from "@/components/ui/button";
import {
  CommentThread,
  buildCommentThreads,
  commentTime,
} from "@/components/socialmanager/comment-thread";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { useSocialSocket, type SocialFrame } from "@/hooks/use-social-socket";

interface PostCommentsBodyProps {
  post: ScheduledPost;
  workspace: string;
  /** Channel lookup, so each comment's moderation resolves its own platform. */
  pageById: Record<string, ManagedChannel>;
}

/**
 * One post's comment thread.
 *
 * Shared by the channel sheet (`channels/[channelId]/_components/post-comments-sheet.tsx`)
 * and the Unified Feed's inline card thread. Both hand it the same three
 * arguments, so there is exactly one implementation of moderation: a thread
 * that appears in two places must not be two components that can drift apart.
 *
 * Comments from the audience and the workspace's own first comments share one
 * timeline, ordered by the time they landed, so a reply reads next to what it
 * answers. Own comments keep their primary tint to stay distinguishable.
 *
 * It owns its own fetching (through the section's Server Actions) and its own
 * socket subscription, so a card can mount it without wiring anything: opening
 * a thread is one request, closing it discards nothing but a cached read.
 */
export function PostCommentsBody({ post, workspace, pageById }: PostCommentsBodyProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // "We could not read them" and "there are none" are different statements, and
  // collapsing the first into the second is how a broken query ends up looking
  // like an empty thread.
  const [loadFailed, setLoadFailed] = useState(false);
  const [commentSyncTask, setCommentSyncTask] = useState<string | null>(null);
  const [syncingComments, setSyncingComments] = useState(false);
  // A comment carries only its channel's nanoid, so this is the only way to
  // name the network a comment came from on a post published to several.
  const { brandOf } = usePlatformBrand();

  useEffect(() => {
    let cancelled = false;
    listPostCommentsAction(post.nanoid, workspace)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) {
          setComments([]);
          setLoadFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post, workspace]);

  useEffect(() => {
    if (!commentSyncTask) return;
    let cancelled = false;
    const iv = setInterval(async () => {
      try {
        const status = await getPostsSyncStatusAction(commentSyncTask, workspace);
        if (status.status === "SUCCESS" || status.status === "FAILURE") {
          setCommentSyncTask(null);
          clearInterval(iv);
          if (!cancelled) {
            const refreshed = await listPostCommentsAction(post.nanoid, workspace);
            setComments(refreshed);
          }
        }
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [commentSyncTask, post, workspace]);

  const handleSyncComments = async () => {
    setSyncingComments(true);
    try {
      const res = await syncCommentsAction({ scheduled_post: post.nanoid }, workspace);
      if ("task_id" in res) setCommentSyncTask(res.task_id);
    } finally {
      setSyncingComments(false);
    }
  };

  /**
   * Re-pull the thread after a moderation change.
   *
   * Deliberately re-fetches rather than patching local state: the moderation
   * action only queues a Celery task, so the platform call may still be in
   * flight and the server's row is the only trustworthy source. Polling
   * `commentSyncTask` above then refreshes once more when the platform has
   * actually acted.
   */
  const refetch = useCallback(async () => {
    try {
      setComments(await listPostCommentsAction(post.nanoid, workspace));
      setLoadFailed(false);
    } catch {
      // Keep the last good list rather than blanking the thread.
      setLoadFailed(true);
    }
  }, [post.nanoid, workspace]);

  // A comment that lands while this sheet is open arrives over the
  // workspace's live socket. The frame only names the post -- it carries no
  // comment -- so the answer is the same re-read the Sync button, the
  // moderation callbacks, and the mount effect all use.
  const onSocialFrame = useCallback(
    (frame: SocialFrame) => {
      if (frame.type === "comment" && frame.post_nanoid === post.nanoid) {
        void refetch();
      }
    },
    [post.nanoid, refetch],
  );
  useSocialSocket(workspace, onSocialFrame);

  // One timeline: sort every comment by when it landed, then rebuild threads so
  // replies sit under the comment they answer.
  const threads = useMemo(
    () =>
      buildCommentThreads(
        [...comments].sort((a, b) => commentTime(a) - commentTime(b)),
      ),
    [comments],
  );

  if (isLoading) {
    return (
      <div className="space-y-3.5">
        {[0, 1].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <section>
      <h4 className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
        <Users className="size-3.5 text-slate-400" />
        Comments
        <span className="ml-auto text-[10px] font-normal text-muted-foreground">
          {comments.length}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="ml-2 h-6 gap-1 px-2 text-[10px] text-slate-500 hover:bg-primary-50 hover:text-primary-600"
          disabled={syncingComments}
          onClick={handleSyncComments}
        >
          <RefreshCw className={`size-3 ${syncingComments ? "animate-spin" : ""}`} />
          {syncingComments ? "Syncing…" : "Sync"}
        </Button>
      </h4>

      {loadFailed ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
          Could not load comments. This is a problem reading VistaSolve, not with
          the post — syncing will not help.
        </div>
      ) : threads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
          No comments yet.
        </div>
      ) : (
        <CommentThread
          threads={threads}
          workspace={workspace}
          pageById={pageById}
          brandOf={brandOf}
          onChanged={refetch}
        />
      )}
    </section>
  );
}
