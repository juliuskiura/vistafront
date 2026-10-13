"use client";

import type { ManagedChannel, PostComment } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { CommentModeration } from "@/components/socialmanager/comment-moderation";
import { CommentActions } from "@/components/socialmanager/comment-composer";
import { PlatformGlyph } from "@/components/platform-icon";
import { supportsPrivateReply } from "@/lib/social/platform-capabilities";

export type BrandResolver = (platform?: string) => string | undefined;

/** Two-letter initials, the fallback for a commenter with no picture. */
export function initials(name: string, whenBlank: string): string {
  return (name || whenBlank)
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Which channel a comment belongs to — a post can be on several at once. */
export function ChannelLabel({
  channel,
  brandOf,
}: {
  channel: ManagedChannel | undefined;
  brandOf: BrandResolver;
}) {
  if (!channel) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <PlatformGlyph platform={brandOf(channel.platform)} size="sm" />
      <span className="truncate">{channel.platform_name || channel.page_name}</span>
    </span>
  );
}

/**
 * A commenter's avatar, or a letter fallback.
 *
 * Facebook expands `from{picture}` on the comment node it already reads;
 * Instagram exposes no profile-picture field at all, so Instagram always falls
 * back to initials. The URL is Meta's signed, short-lived lookaside form.
 */
export function CommentAvatar({
  url,
  name,
  fallback,
  tone,
  className,
}: {
  url: string;
  name: string;
  fallback: string;
  tone: string;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote signed URL, not a local asset
      <img
        src={url}
        alt={name}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        tone,
        className,
      )}
    >
      {fallback}
    </span>
  );
}

/** Per-comment moderation and reply controls, resolved against its own channel. */
export function CommentControls({
  comment,
  workspace,
  pageById,
  brandOf,
  onChanged,
}: {
  comment: PostComment;
  workspace: string;
  pageById: Record<string, ManagedChannel>;
  brandOf: BrandResolver;
  onChanged: () => void;
}) {
  const channel = pageById[comment.managed_page];
  const isOwn = comment.comment_type !== "audience";
  return (
    <>
      <CommentModeration
        commentNanoid={comment.nanoid}
        workspace={workspace}
        platform={channel?.platform}
        isHidden={Boolean(comment.is_hidden)}
        canModerate={Boolean(comment.external_comment_id) && !comment.is_private_reply}
        isOwnComment={isOwn}
        onChanged={onChanged}
      />
      {comment.comment_type === "audience" && !comment.is_private_reply && (
        <CommentActions
          workspace={workspace}
          commentNanoid={comment.nanoid}
          canReply={Boolean(comment.external_comment_id)}
          canPrivateReply={
            Boolean(comment.external_comment_id) &&
            supportsPrivateReply(brandOf(channel?.platform))
          }
          onQueued={onChanged}
        />
      )}
    </>
  );
}
