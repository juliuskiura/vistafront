"use client";

import type { ManagedChannel, PostComment } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { formatMediumDateTime } from "@/lib/dates";
import { commentAuthor } from "@/lib/social/comment-author";
import {
  CommentAvatar,
  CommentControls,
  ChannelLabel,
  initials,
  type BrandResolver,
} from "@/components/socialmanager/comment-thread-parts";

export interface CommentThreadData {
  root: PostComment;
  replies: PostComment[];
}

/**
 * Rebuild the reply tree from a flat comment list.
 *
 * The backend returns replies as ordinary rows carrying `parent_comment`, so
 * nesting is reconstructed on this side. A reply is anything whose parent is
 * present; deeper chains collapse into the same ordered reply list rather than
 * vanishing, so a row whose parent is present is never rendered as a root.
 */
export function buildCommentThreads(list: PostComment[]): CommentThreadData[] {
  const ids = new Set(list.map((comment) => comment.nanoid));
  const childrenByParent = new Map<string, PostComment[]>();
  for (const comment of list) {
    if (comment.parent_comment && ids.has(comment.parent_comment)) {
      const siblings = childrenByParent.get(comment.parent_comment);
      if (siblings) siblings.push(comment);
      else childrenByParent.set(comment.parent_comment, [comment]);
    }
  }
  return list
    .filter((comment) => !(comment.parent_comment && ids.has(comment.parent_comment)))
    .map((root) => {
      const replies: PostComment[] = [];
      const collect = (parentId: string) => {
        for (const child of childrenByParent.get(parentId) ?? []) {
          replies.push(child);
          collect(child.nanoid);
        }
      };
      collect(root.nanoid);
      return { root, replies };
    });
}

/**
 * Chronological key, tolerating the nulls the backend returns: a queued comment
 * has no `published_at` yet, so it falls back to when the row was written.
 */
export function commentTime(comment: PostComment): number {
  return Date.parse(comment.published_at ?? comment.created_at) || 0;
}

/**
 * One comment, at either depth.
 *
 * A root comment is a full card with generous padding; its content is indented
 * under the author name (`sm:pl-13` = avatar + gap). A reply is a tighter card
 * inside the parent's thread. Own comments keep the primary tint that marks them
 * out from the audience.
 */
function CommentCard({
  comment,
  depth,
  workspace,
  pageById,
  brandOf,
  onChanged,
}: {
  comment: PostComment;
  depth: number;
  workspace: string;
  pageById: Record<string, ManagedChannel>;
  brandOf: BrandResolver;
  onChanged: () => void;
}) {
  const isOwn = comment.comment_type !== "audience";
  const author = commentAuthor(comment, isOwn ? "You" : undefined);
  const isReply = depth > 0;

  return (
    <div
      className={cn(
        "min-w-0 border shadow-2xs",
        isReply
          ? "rounded-xl border-indigo-100 bg-indigo-50/60 p-3"
          : "rounded-2xl p-4 sm:p-5",
        !isReply && (isOwn ? "border-primary-100 bg-primary-50/50" : "bg-card"),
      )}
    >
      <div className={cn("flex items-start justify-between gap-3", isReply ? "mb-1.5" : "mb-3")}>
        <div className="flex min-w-0 items-center gap-3">
          <CommentAvatar
            url={author.avatarUrl}
            name={author.name}
            fallback={initials(author.name, isOwn ? "You" : "A")}
            tone={
              isOwn
                ? "bg-gradient-to-br from-primary-500 to-purple-600 text-white"
                : "bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600"
            }
            className={
              isReply
                ? "size-7 border border-indigo-200 text-[10px]"
                : "size-10 border border-slate-200 text-xs"
            }
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {isOwn && !isReply ? (
                <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-medium capitalize text-primary-600">
                  {comment.status}
                </span>
              ) : (
                <span className="truncate text-sm font-bold text-slate-900">
                  {author.name}
                </span>
              )}
              {isReply && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  {comment.is_private_reply ? "Private" : "Reply"}
                </span>
              )}
            </div>
            <ChannelLabel channel={pageById[comment.managed_page]} brandOf={brandOf} />
          </div>
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {formatMediumDateTime(comment.published_at)}
        </span>
      </div>

      <p
        className={cn(
          "whitespace-pre-wrap break-words leading-relaxed",
          isReply
            ? "text-xs text-slate-800"
            : cn(
                "text-sm sm:pl-13",
                comment.is_hidden ? "text-slate-400 line-through" : "text-slate-700",
              ),
        )}
      >
        {comment.content}
      </p>

      {comment.is_private_reply && (
        <p className="mt-1 text-[10px] font-medium text-muted-foreground">
          Private reply — sent to the commenter only
        </p>
      )}

      <div
        className={cn(
          "flex flex-wrap items-center gap-x-1 gap-y-1",
          isReply ? "mt-2" : "mt-3 border-t border-slate-100 pt-3 sm:pl-13",
        )}
      >
        <CommentControls
          comment={comment}
          workspace={workspace}
          pageById={pageById}
          brandOf={brandOf}
          onChanged={onChanged}
        />
      </div>
    </div>
  );
}

/**
 * One post's comment thread, in time order.
 *
 * Every top-level comment is its own card; its replies hang beneath it off a
 * left vertical line so a long thread reads as one conversation while an
 * unreplied comment still stands as a complete card on its own.
 */
export function CommentThread({
  threads,
  workspace,
  pageById,
  brandOf,
  onChanged,
}: {
  threads: CommentThreadData[];
  workspace: string;
  pageById: Record<string, ManagedChannel>;
  brandOf: BrandResolver;
  onChanged: () => void;
}) {
  return (
    <ul className="space-y-3.5">
      {threads.map(({ root, replies }) => (
        <li key={root.nanoid}>
          <CommentCard
            comment={root}
            depth={0}
            workspace={workspace}
            pageById={pageById}
            brandOf={brandOf}
            onChanged={onChanged}
          />
          {replies.length > 0 && (
            <div className="mt-3 ml-4 space-y-2 border-l-2 border-indigo-200 py-1 sm:ml-6 sm:pl-13">
              {replies.map((reply) => (
                <CommentCard
                  key={reply.nanoid}
                  comment={reply}
                  depth={1}
                  workspace={workspace}
                  pageById={pageById}
                  brandOf={brandOf}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
