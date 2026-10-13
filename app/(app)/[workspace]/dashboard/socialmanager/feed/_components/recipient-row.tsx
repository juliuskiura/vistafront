"use client";

import { useState } from "react";
import type { ManagedChannel, PostRecipient } from "@/lib/api/types";
import {
  AlertTriangle,
  CheckCircle2,
  CornerDownRight,
  Edit3,
  Eye,
  ExternalLink,
  Loader2,
  Maximize2,
  Trash2,
} from "@/lib/icons";
import { STATUS_STYLES } from "@/components/socialmanager/platform-gradients";
import { usePlatformStyleResolver } from "@/components/platform-icon";
import { SocialIconSolid } from "@/components/social-icons";
import { ChannelAvatar } from "@/components/socialmanager/channel-avatar";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { deliveryGuidance, elapsedSince } from "@/lib/social/delivery-error";
import { formatMediumDateTime } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { RecipientEditDialog } from "./recipient-edit-dialog";
import { isLiveCopy, waitForLiveTask } from "./recipient-utils";
import {
  pushRecipientDeleteAction,
  pushRecipientUpdateAction,
} from "../../actions";
import { PlatformPostSheet } from "./platform-post-sheet";

/** The first image for a delivery, so the row can hint at what it carried. */
function thumbnailOf(recipient: PostRecipient): string | undefined {
  return recipient.media_image_urls?.[0] ?? recipient.media_urls?.[0];
}

/** One delivery of the post: the channel, that channel's own copy, and how the
 *  delivery went. */
export function RecipientRow({
  recipient,
  page,
  workspace,
  onEdit,
  onDelete,
  onView,
  pendingNanoid,
}: {
  recipient: PostRecipient;
  page: ManagedChannel | undefined;
  workspace: string;
  /** When provided, Edit/Delete buttons render for live copies. When absent
   *  (e.g. the unified feed card), rows are read-only. */
  onEdit: ((recipient: PostRecipient) => void) | undefined;
  onDelete: ((recipient: PostRecipient) => void) | undefined;
  onView: ((recipient: PostRecipient) => void) | undefined;
  pendingNanoid: string | null;
}) {
  const { brandOf } = usePlatformBrand();
  const styleOf = usePlatformStyleResolver();
  const brand = brandOf(page?.platform);
  const style = styleOf(page?.platform);
  const gate = deliveryGuidance(recipient.error_type);
  const elapsed = elapsedSince(recipient.attempted_at);
  const thumbnail = thumbnailOf(recipient);
  
  const [isPlatformSheetOpen, setIsPlatformSheetOpen] = useState(false);
  
  // Get the primary platform from the recipient data
  const platformPostUrl = recipient.link_url; // The URL to the actual platform post
  
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
            <SocialIconSolid name={brand} className="size-6" />
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
          <button
            onClick={() => setIsPlatformSheetOpen(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            title="View on platform"
          >
            <Maximize2 className="size-3" />
            View on {brand?.toUpperCase() || "platform"}
          </button>
        )}
        {onView && isLiveCopy(recipient) && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1"
            disabled={pendingNanoid !== null}
            onClick={() => onView(recipient)}
            title="View platform post"
          >
            <Eye className="size-3" />
          </Button>
        )}
        {thumbnail && (
          <div className="size-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-200">
            <img src={thumbnail} alt="" loading="lazy" className="size-full object-cover" />
          </div>
        )}
        {onEdit && onDelete && isLiveCopy(recipient) && (
          <span className="flex shrink-0 items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              className="gap-1"
              disabled={pendingNanoid !== null}
              onClick={() => onEdit(recipient)}
            >
              <Edit3 className="size-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
              disabled={pendingNanoid !== null}
              onClick={() => onDelete(recipient)}
            >
              {pendingNanoid === recipient.nanoid ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Trash2 className="size-3" />
              )}
            </Button>
          </span>
        )}
      </div>

      {/* Platform Post Sheet */}
      {isPlatformSheetOpen && (
        <PlatformPostSheet
          post={recipient}
          pageById={page ? { [recipient.managed_page]: page } : {}}
          workspace={workspace}
          open={isPlatformSheetOpen}
          onOpenChange={setIsPlatformSheetOpen}
          platformPostUrl={platformPostUrl}
        />
      )}
    </li>
  );
}
