"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Users } from "lucide-react";

import type { ManagedChannel, PostComment, ScheduledPost } from "@/lib/api/types";
import { getPostsSyncStatusAction, listPostCommentsAction, syncCommentsAction } from "../../../actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMediumDateTime } from "@/lib/dates";
import { CommentModeration } from "@/components/socialmanager/comment-moderation";
import { CommentActions } from "@/components/socialmanager/comment-composer";
import { PlatformGlyph } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";

interface PostCommentsBodyProps {
  post: ScheduledPost;
  workspace: string;
  /** Channel lookup, so each comment's moderation resolves its own platform. */
  pageById: Record<string, ManagedChannel>;
}

/**
 * Which channel a comment belongs to.
 *
 * A post can be published to several networks at once, and the comment thread
 * interleaves them into one list — so without this there is no way to tell a
 * Facebook comment from an Instagram one. That is not cosmetic: the two need
 * different actions, since Instagram publishes no comment-edit operation at
 * all, so a moderator looking at the wrong channel would click a button that
 * cannot work.
 *
 * Renders nothing when the channel is unknown rather than guessing, because an
 * unlabelled comment is better than a confidently wrong label.
 */
function ChannelLabel({
  channel,
  brandOf,
}: {
  channel: ManagedChannel | undefined;
  brandOf: (platform?: string) => string | undefined;
}) {
  if (!channel) return null;
  return (
    <span className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground">
      <PlatformGlyph platform={brandOf(channel.platform)} size="sm" />
      <span className="truncate">{channel.platform_name || channel.page_name}</span>
    </span>
  );
}

/**
 * A commenter's avatar, or a letter fallback.
 *
 * Facebook only: the provider expands `from{picture}` on the comment node it is
 * already reading, so it costs no extra call. Instagram exposes no
 * profile-picture field at all, so Instagram comments always use the fallback —
 * a platform limitation, not a missing scope.
 *
 * The fallback keeps the existing two-letter initials, which read better than a
 * single character for a full name. It is the primary design, not an error
 * state: someone who has set no picture looks the same on every platform, and a
 * broken image is worse than initials.
 */
function CommentAvatar({
  url,
  name,
  fallback,
  tone,
}: {
  url?: string;
  name: string;
  fallback: string;
  tone: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Meta's lookaside
      // URL is remote and signed; next/image would cache it under our own
      // storage, which is the local-copy decision still open in
      // reading/0-pending-decisions.md.
      <img
        src={url}
        alt={name}
        className="mt-0.5 size-7 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
        tone,
      )}
    >
      {fallback}
    </span>
  );
}

/** Two-letter initials, the fallback for a commenter with no picture. */
function initials(name: string, whenBlank: string): string {
  return (name || whenBlank)
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

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

  const audience = comments.filter((c) => c.comment_type === "audience");
  const own = comments.filter((c) => c.comment_type === "internal");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
          <Users className="size-3.5 text-slate-400" />
          Audience comments
          <span className="ml-auto text-[10px] font-normal text-muted-foreground">{audience.length}</span>
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
            Could not load comments. This is a problem reading VistaSolve, not
            with the post — syncing will not help.
          </div>
        ) : audience.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
            No audience comments yet.
          </div>
        ) : (
          <ul className="space-y-2.5">
            {audience.map((c) => (
              <li key={c.nanoid} className="flex gap-2.5">
                <CommentAvatar
                  url={c.author_avatar_url}
                  name={c.author_name || "Anonymous"}
                  fallback={initials(c.author_name, "A")}
                  tone="bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600"
                />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border bg-card px-3 py-2 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-800">
                      {c.author_name || "Anonymous"}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatMediumDateTime(c.published_at)}
                    </span>
                  </div>
                  <ChannelLabel channel={pageById[c.managed_page]} brandOf={brandOf} />
                  <p
                    className={
                      c.is_hidden
                        ? "mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-400 line-through"
                        : "mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700"
                    }
                  >
                    {c.content}
                  </p>
                  {c.is_private_reply && (
                    /* A direct message, not something posted publicly. Showing
                       it as an ordinary reply is the one thing it must never be
                       mistaken for. */
                    <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
                      Private reply — sent to the commenter only
                    </p>
                  )}
                  <CommentModeration
                    commentNanoid={c.nanoid}
                    workspace={workspace}
                    platform={pageById[c.managed_page]?.platform}
                    isHidden={Boolean(c.is_hidden)}
                    canModerate={
                      Boolean(c.external_comment_id) && !c.is_private_reply
                    }
                    isOwnComment
                    onChanged={refetch}
                  />
                  {c.comment_type === "audience" && !c.is_private_reply && (
                    <CommentActions
                      workspace={workspace}
                      commentNanoid={c.nanoid}
                      canReply={Boolean(c.external_comment_id)}
                      canPrivateReply={Boolean(c.external_comment_id)}
                      onQueued={refetch}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {own.length > 0 && (
        <section>
          <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
            <Sparkles className="size-3.5 text-primary-500" />
            Your first comments
            <span className="ml-auto text-[10px] font-normal text-muted-foreground">{own.length}</span>
          </h4>
          <ul className="space-y-2.5">
            {own.map((c) => (
              <li key={c.nanoid} className="flex gap-2.5">
                <CommentAvatar
                  url={c.author_avatar_url}
                  name={c.author_name || "You"}
                  fallback={initials(c.author_name, "You")}
                  tone="bg-gradient-to-br from-primary-500 to-purple-600 text-white"
                />
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-primary-100 bg-primary-50/50 px-3 py-2 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium capitalize text-primary-600">
                      {c.status}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatMediumDateTime(c.published_at)}
                    </span>
                  </div>
                  <ChannelLabel channel={pageById[c.managed_page]} brandOf={brandOf} />
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{c.content}</p>
                  <CommentModeration
                    commentNanoid={c.nanoid}
                    workspace={workspace}
                    platform={pageById[c.managed_page]?.platform}
                    isHidden={Boolean(c.is_hidden)}
                    canModerate={Boolean(c.external_comment_id)}
                    isOwnComment
                    onChanged={refetch}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}