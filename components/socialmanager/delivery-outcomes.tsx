"use client";

/**
 * Per-channel delivery outcomes for a post.
 *
 * A post's single `error_message` is the aggregate, which for a multi-channel
 * post reads "One or more recipients failed" — true, and useless. The detail
 * lives on each recipient, and each has its own reason, so it is rendered per
 * channel: what happened, what to do, and whether another attempt is worth
 * offering. Grouping by reason rather than by channel is deliberate — a user
 * with five channels and one bad video wants to be told "these four are fine,
 * this one needs a different file" once, not five times.
 *
 * Also surfaces `processing`, which is a normal state rather than a failure: the
 * platform is transcoding and the provider is waiting, which can take minutes.
 */

import { Clock, Info, RefreshCw } from "@/lib/icons";
import type { PostRecipient } from "@/lib/api/types";
import {
  deliveryGuidance,
  elapsedSince,
  isInFlight,
} from "@/lib/social/delivery-error";

/** Cap the list so a 30-channel post does not turn the panel into a wall. */
const MAX_SHOWN = 6;

function ChannelOutcome({ recipient }: { recipient: PostRecipient }) {
  const guidance = deliveryGuidance(recipient.error_type);

  return (
    <div className="rounded-lg border border-red-200 bg-white p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-neutral-900">
          {recipient.managed_page_name || "Channel"}
        </span>
        <span className="shrink-0 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-red-700">
          {recipient.error_type || "failed"}
        </span>
      </div>
      {/* The platform's own words first — it knows the specific rejection
          ("Container status ERROR: video must be at least 3 seconds"), and
          that is the part only the platform can explain. */}
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-700">
        {recipient.error_message || guidance.headline}
      </p>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">
        {guidance.remedy}
      </p>
    </div>
  );
}

function ProcessingChannel({ recipient }: { recipient: PostRecipient }) {
  const elapsed = elapsedSince(recipient.attempted_at);
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-neutral-900">
          {recipient.managed_page_name || "Channel"}
        </span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-800">
          <RefreshCw className="size-2.5 animate-spin" />
          {elapsed ? `${elapsed} in` : "in progress"}
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-neutral-600">
        The platform is processing this video. Large files can take a few
        minutes — there is nothing to do but wait.
      </p>
    </div>
  );
}

function PublishedChannel({ recipient }: { recipient: PostRecipient }) {
  const ago = elapsedSince(recipient.published_at);
  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-semibold text-neutral-900">
          {recipient.managed_page_name || "Channel"}
        </span>
        <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
          published
        </span>
      </div>
      {ago && <p className="mt-1 text-[11px] text-neutral-500">{ago} ago</p>}
    </div>
  );
}

export function DeliveryOutcomes({ recipients }: { recipients: PostRecipient[] }) {
  const processing = recipients.filter(isInFlight);
  const failed = recipients.filter((r) => r.status === "failed");
  const published = recipients.filter((r) => r.status === "published");

  if (!processing.length && !failed.length && !published.length) return null;

  const shown = failed.slice(0, MAX_SHOWN);
  const hidden = failed.length - shown.length;

  return (
    <div className="space-y-2">
      {processing.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
            <Clock className="size-3" />
            Processing
          </p>
          <div className="space-y-1.5">
            {processing.map((r) => (
              <ProcessingChannel key={r.nanoid} recipient={r} />
            ))}
          </div>
        </div>
      )}

      {failed.length > 0 && (
        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-700">
            <Info className="size-3" />
            {failed.length === 1 ? "1 channel failed" : `${failed.length} channels failed`}
          </p>
          <div className="space-y-1.5">
            {shown.map((r) => (
              <ChannelOutcome key={r.nanoid} recipient={r} />
            ))}
            {hidden > 0 && (
              <p className="text-[11px] text-neutral-500">
                and {hidden} more with the same problem
              </p>
            )}
          </div>
        </div>
      )}

      {published.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Delivered to {published.length === 1 ? "1 channel" : `${published.length} channels`}
          </p>
          <div className="space-y-1.5">
            {published.slice(0, MAX_SHOWN).map((r) => (
              <PublishedChannel key={r.nanoid} recipient={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
