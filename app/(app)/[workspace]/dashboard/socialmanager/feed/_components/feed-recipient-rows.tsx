"use client";

import { useMemo } from "react";

import type { ManagedChannel, PostRecipient } from "@/lib/api/types";
import { CornerDownRight, ExternalLink } from "@/lib/icons";
import { STATUS_STYLES } from "@/components/socialmanager/platform-gradients";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { SocialIconSolid } from "@/components/social-icons";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { deliveryGuidance, elapsedSince } from "@/lib/social/delivery-error";
import { formatMediumDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

/** The first image for a delivery, so the row can hint at what it carried. */
function thumbnailOf(recipient: PostRecipient): string | undefined {
  return recipient.media_image_urls?.[0] ?? recipient.media_urls?.[0];
}

/** One delivery of the post: the channel, that channel's own copy, and how the
 *  delivery went. */
function RecipientRow({
  recipient,
  page,
  workspace,
}: {
  recipient: PostRecipient;
  page: ManagedChannel | undefined;
  workspace: string;
}) {
  const { brandOf } = usePlatformBrand();
  const styleOf = usePlatformStyleResolver();
  const brand = brandOf(page?.platform);
  const style = styleOf(page?.platform);
  const gate = deliveryGuidance(recipient.error_type);
  const elapsed = elapsedSince(recipient.attempted_at);
  const thumbnail = thumbnailOf(recipient);

  return (
    <li className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white p-3 transition-colors hover:bg-slate-50">
      <div className="flex min-w-0 items-center gap-3">
        <span className="relative shrink-0">
          <ChannelAvatar
            nanoid={page?.nanoid ?? recipient.nanoid}
            pictureUrl={page?.profile_picture_url ?? ""}
            workspace={workspace}
            className="size-9 rounded-full object-cover ring-1 ring-black/5"
            fallback={
              <span className="flex size-9 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-500 ring-1 ring-black/5">
                {recipient.managed_page_name.slice(0, 1).toUpperCase()}
              </span>
            }
          />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white ring-1 ring-black/5",
              style.color,
            )}
          >
            <SocialIconSolid name={brand} className="size-2.5" />
          </span>
        </span>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-xs font-bold text-slate-900">
              {recipient.managed_page_name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                STATUS_STYLES[recipient.status] ?? STATUS_STYLES.draft,
              )}
            >
              {recipient.status}
            </span>
          </div>
          {/* The channel's own copy, not the master: this is the text that
              actually reached the platform. */}
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {recipient.content?.trim() || "Same copy as the post above"}
          </p>
          {recipient.status === "failed" && (
            <p className="mt-0.5 text-[11px] text-red-600">
              {gate.headline}
              {gate.remedy ? ` ${gate.remedy}` : ""}
            </p>
          )}
          {recipient.status === "processing" && (
            <p className="mt-0.5 text-[11px] text-neutral-400">
              {elapsed ? `In flight for ${elapsed}` : "Sending now…"}
            </p>
          )}
          {recipient.published_at && (
            <time
              dateTime={recipient.published_at}
              className="mt-0.5 block text-[10px] text-slate-400"
            >
              {formatMediumDateTime(recipient.published_at)}
            </time>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {recipient.link_url && (
          <a
            href={recipient.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
          >
            View on {brand?.toUpperCase() || "platform"}
            <ExternalLink className="size-3" />
          </a>
        )}
        {thumbnail && (
          <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
            <img src={thumbnail} alt="" loading="lazy" className="size-full object-cover" />
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The "child posts" tree: one row per channel the master post reached.
 *
 * Deliberately not a collapsed accordion any more — the tree box keeps the
 * parent post's copies in view, on a left rail, the way the Unified Feed's
 * prototype presents them, so "did this go everywhere?" is answered without a
 * click. Rows still carry the per-channel copy and any failure, since a state
 * the reader has to see must never hide behind a summary.
 *
 * There is deliberately no per-row overflow menu: every row would carry the
 * same three items and none of them act on the row — per-channel edit and
 * delete live on the post detail page, where they can show their consequences.
 */
export function FeedRecipientRows({
  recipients,
  pagesById,
  workspace,
}: {
  recipients: PostRecipient[];
  pagesById: Record<string, ManagedChannel>;
  workspace: string;
}) {
  const needsAttention = useMemo(
    () =>
      recipients.some((r) => r.status === "failed" || r.status === "processing"),
    [recipients],
  );

  return (
    <div className="mt-4">
      <div className="relative ml-5 space-y-3 border-l-2 border-indigo-200 py-1 pl-6 sm:pl-8">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
          <span className="flex items-center gap-1.5">
            <CornerDownRight className="size-3.5 text-indigo-400" />
            {recipients.length} child post{recipients.length === 1 ? "" : "s"} shared
            to networks
          </span>
          {needsAttention && (
            <span className="text-[11px] font-bold text-amber-600">
              Needs attention
            </span>
          )}
        </div>

        <ul className="space-y-2.5">
          {recipients.map((recipient) => (
            <RecipientRow
              key={recipient.nanoid}
              recipient={recipient}
              page={pagesById[recipient.managed_page]}
              workspace={workspace}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
