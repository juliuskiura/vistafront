"use client";

import Link from "next/link";

import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";
import { Heart, MessageCircle } from "@/lib/icons";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { cn } from "@/lib/utils";

import { FeedHeader } from "./feed-header";
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

  const detailHref = `/${workspaceSlug}/dashboard/socialmanager/${post.nanoid}`;

  // One logo per *brand* reached — three Instagram channels are one Instagram
  // icon, not three — so the strip reads as "which networks" the post went to.
  const brands = Array.from(
    new Set(
      post.recipients
        .map((r) => brandOf(pagesById[r.managed_page]?.platform))
        .filter((b): b is string => Boolean(b)),
    ),
  );

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
        <span className="sr-only">Open post in detail</span>
      </Link>

      <FeedHeader post={post} brands={brands} status={post.status} />

      <div className="relative mt-3">
        <CaptionWithHashtags
          text={post.content?.trim() || "No content"}
          className="text-sm leading-relaxed whitespace-pre-wrap break-words text-neutral-800"
        />
        <FeedMedia post={post} />
      </div>

      {post.recipients.length > 0 && (
        <FeedRecipientRows
          recipients={post.recipients}
          pagesById={pagesById}
          workspace={workspace}
        />
      )}

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
      </div>

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
