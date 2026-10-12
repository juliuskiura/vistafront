"use client";

import { useMemo } from "react";

import type { ManagedChannel, PostRecipient } from "@/lib/api/types";
import { ChevronDown, ExternalLink } from "@/lib/icons";
import { STATUS_STYLES } from "@/components/socialmanager/platform-gradients";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { SocialIconSolid } from "@/components/social-icons";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { deliveryGuidance, elapsedSince } from "@/lib/social/delivery-error";
import { formatMediumDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";

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

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
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

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-sm font-semibold text-neutral-900">
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
        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
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
          <p className="mt-0.5 text-[11px] text-neutral-400">
            <time dateTime={recipient.published_at}>
              {formatMediumDateTime(recipient.published_at)}
            </time>
          </p>
        )}
      </div>

      {recipient.link_url && (
        <a
          href={recipient.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
        >
          View on {brand?.toUpperCase() || "platform"}
          <ExternalLink className="size-3" />
        </a>
      )}
    </li>
  );
}

/**
 * The "link posts" section: one row per channel the post reached.
 *
 * Collapsed by default because the summary line answers the question ("did this
 * go everywhere?") in one glance, and expanded without being asked when any
 * channel failed or is in flight — that is the case a reader has to see. The
 * native `<details>` element carries the expanded/collapsed state for
 * assistive tech, so no ARIA is needed here.
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
  const published = useMemo(
    () => recipients.filter((r) => r.status === "published").length,
    [recipients],
  );
  const needsAttention = useMemo(
    () =>
      recipients.some((r) => r.status === "failed" || r.status === "processing"),
    [recipients],
  );

  return (
    <details
      className="group mt-3 rounded-xl border border-neutral-200 bg-neutral-50/60 p-2"
      open={needsAttention}
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-lg px-1.5 py-1 text-xs font-medium text-neutral-600 hover:bg-white">
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
        <span>
          {recipients.length} channel{recipients.length === 1 ? "" : "s"} ·{" "}
          {published} published
          {needsAttention ? " · needs attention" : ""}
        </span>
      </summary>
      <ul className="mt-2 space-y-1.5">
        {recipients.map((recipient) => (
          <RecipientRow
            key={recipient.nanoid}
            recipient={recipient}
            page={pagesById[recipient.managed_page]}
            workspace={workspace}
          />
        ))}
      </ul>
    </details>
  );
}
