"use client";

import Link from "next/link";

import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";
import { Heart, MessageCircle } from "@/lib/icons";
import { STATUS_STYLES } from "@/components/socialmanager/platform-gradients";
import { PlatformGlyph } from "@/components/platform-icon";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { formatMediumDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

import { CaptionWithHashtags } from "./feed-caption";
import { FeedMedia } from "./feed-media";
import { FeedRecipientRows } from "./feed-recipient-rows";
import { FeedComments } from "./feed-comments";

/** One published post, across every channel it reached.
 *
 *  The card is a link to the post's detail page — the place that owns per-channel
 *  edit and delete — with the actions a reader wants *here* (open the audience
 *  thread, jump to the post on the platform) sitting above it at a higher stack
 *  level so they stay clickable and keyboard-reachable. */
export function FeedCard({
  post,
  pagesById,
  workspace,
  workspaceSlug,
  isLabel,
  threadOpen,
  onOpenThread,
}: {
  post: ScheduledPost;
  pagesById: Record<string, ManagedChannel>;
  workspace: string;
  /** The public workspace domain, for the detail-page link. */
  workspaceSlug: string;
  /** True when the user arrived from this post's detail page. */
  isLabel: boolean;
  /** Lifted, not local: the feed needs to know whose thread is open so it can
   *  aim the socket's invalidation. */
  threadOpen: boolean;
  onOpenThread: (nanoid: string) => void;
}) {
  const { brandOf } = usePlatformBrand();

  const primary = post.recipients[0];
  const primaryPage = primary ? pagesById[primary.managed_page] : undefined;
  const primaryBrand = brandOf(primaryPage?.platform);
  const detailHref = `/${workspaceSlug}/dashboard/socialmanager/${post.nanoid}`;

  return (
    <li
      id={`post-${post.nanoid}`}
      data-entry={isLabel ? "true" : undefined}
      className={cn(
        "relative rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs transition-shadow hover:shadow-sm sm:p-5",
        isLabel && "ring-2 ring-primary-400 ring-offset-2",
      )}
    >
      {/* The whole card is the link to the detail page. */}
      <Link
        href={detailHref}
        className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <span className="sr-only">
          Open {primary?.managed_page_name ?? "post"} in detail
        </span>
      </Link>

      <div className="relative flex items-start gap-3">
        <ChannelAvatar
          nanoid={primaryPage?.nanoid ?? primary?.nanoid ?? post.nanoid}
          pictureUrl={primaryPage?.profile_picture_url ?? ""}
          workspace={workspace}
          alt={primary?.managed_page_name ?? ""}
          className="size-11 rounded-full object-cover ring-1 ring-black/5"
          fallback={
            <span className="flex size-11 items-center justify-center rounded-full bg-neutral-100 text-sm font-bold text-neutral-500 ring-1 ring-black/5">
              {(primary?.managed_page_name ?? "?").slice(0, 1).toUpperCase()}
            </span>
          }
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {primary?.managed_page_name || "No channel"}
          </p>
          <p className="flex flex-wrap items-center gap-1 text-xs text-neutral-500">
            <PlatformGlyph
              platform={primaryBrand}
              size="sm"
              className="inline-block"
            />
            <span>{primaryPage?.platform_name || primaryBrand || "—"}</span>
            {post.published_at && (
              <>
                <span aria-hidden>·</span>
                <time dateTime={post.published_at}>
                  {formatMediumDateTime(post.published_at)}
                </time>
              </>
            )}
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
            STATUS_STYLES[post.status] ?? STATUS_STYLES.draft,
          )}
        >
          {post.status}
        </span>
      </div>

      <div className="relative mt-3">
        <CaptionWithHashtags
          text={post.content?.trim() || "No content"}
          className="text-sm leading-relaxed whitespace-pre-wrap break-words text-neutral-800"
        />
        <FeedMedia post={post} />
      </div>

      {/* ── Engagement footer ── */}
      <div className="relative mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-neutral-100 pt-3">
        <span className="flex items-center gap-1.5 text-xs text-neutral-500">
          <Heart className="size-3.5" />
          {post.reactions_count.toLocaleString()} reactions
        </span>
        <button
          type="button"
          aria-expanded={threadOpen}
          aria-controls={`feed-thread-${post.nanoid}`}
          onClick={() => onOpenThread(post.nanoid)}
          className="z-10 inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100"
        >
          <MessageCircle className="size-3.5" />
          {post.comment_count.toLocaleString()} comments
          <span className="text-neutral-400">{threadOpen ? "Hide" : "Show"}</span>
        </button>
        {post.recipients.length > 1 && (
          <span className="text-xs text-neutral-400">
            across {post.recipients.length} channels
          </span>
        )}
      </div>

      {post.recipients.length > 0 && (
        <FeedRecipientRows
          recipients={post.recipients}
          pagesById={pagesById}
          workspace={workspace}
        />
      )}

      {threadOpen && (
        <div
          id={`feed-thread-${post.nanoid}`}
          className="relative z-10 mt-3 border-t border-neutral-100 pt-3"
        >
          <FeedComments post={post} workspace={workspace} pagesById={pagesById} />
        </div>
      )}
    </li>
  );
}
