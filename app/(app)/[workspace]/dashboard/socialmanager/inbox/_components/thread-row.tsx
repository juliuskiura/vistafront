"use client";

import { formatMediumDate } from "@/lib/dates";
import { PlatformGlyph, usePlatformStyleResolver } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { cn } from "@/lib/utils";

import { InboxAvatar } from "./inbox-avatar";

export interface ThreadRowProps {
  participantName: string;
  participantPictureUrl: string;
  preview: string;
  lastMessageAt: string | null;
  unreadCount: number;
  needsReauth: boolean;
  /** Null when the channel could not be resolved — see the list route. */
  channel: { page_name: string; platform_slug: string } | null;
  selected: boolean;
  onSelect: () => void;
}

/**
 * One row in the thread list.
 *
 * A `<button>` rather than a link: selection is client state expressed through
 * the URL, and a link would announce itself as navigation to assistive tech
 * while behaving like a tab switch.
 */
export function ThreadRow({
  participantName,
  participantPictureUrl,
  preview,
  lastMessageAt,
  unreadCount,
  needsReauth,
  channel,
  selected,
  onSelect,
}: ThreadRowProps) {
  const unread = unreadCount > 0;
  const { nameOf } = usePlatformBrand();
  const resolvePlatformStyle = usePlatformStyleResolver();

  // Named after the brand, not the door, so the label always describes the glyph
  // beside it: `auth_destination` decides both, and a channel connected through
  // a Facebook Page is an Instagram one. The local style map covers a platform
  // whose row has not loaded.
  const platformLabel = channel
    ? nameOf(channel.platform_slug) ||
      resolvePlatformStyle(channel.platform_slug).label ||
      channel.platform_slug
    : "";

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-l-2 px-4 py-3 text-left transition-colors",
        selected
          ? "border-l-primary-600 bg-primary-50/60"
          : "border-l-transparent hover:bg-gray-50",
      )}
    >
      <InboxAvatar src={participantPictureUrl} name={participantName} />

      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              unread ? "font-semibold text-gray-900" : "text-gray-800",
            )}
          >
            {participantName}
          </span>
          <span className="shrink-0 text-xs text-gray-400">
            {formatMediumDate(lastMessageAt)}
          </span>
        </span>

        {/* Which platform and which connected channel this thread belongs to.
            A workspace with several Pages has one inbox, and the same person can
            write to two of them, so the row is ambiguous without it — and the
            platform alone is not enough either, since one workspace routinely
            holds several channels on the same one. Hidden entirely when
            unresolved: an unattributed thread is better than one labelled with
            the wrong channel. */}
        {channel && (
          <span className="mt-0.5 flex items-center gap-1.5 text-[11px]">
            <PlatformGlyph platform={channel.platform_slug} size="sm" />
            <span className="shrink-0 font-medium text-gray-500">
              {platformLabel}
            </span>
            <span aria-hidden="true" className="shrink-0 text-gray-300">
              ·
            </span>
            <span className="truncate text-gray-400">{channel.page_name}</span>
          </span>
        )}

        <span className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              "line-clamp-1 flex-1 text-xs",
              unread ? "text-gray-700" : "text-gray-500",
            )}
          >
            {preview || "No messages yet"}
          </span>
          {needsReauth && (
            <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
              Reconnect
            </span>
          )}
          {unread && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-[10px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
