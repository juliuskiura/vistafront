/**
 * What a failed delivery is asking the user to do.
 *
 * The backend classifies every publish failure (`providers.base.ProviderError`),
 * and that classification is not decoration — the categories call for opposite
 * actions. A `validation` failure means the platform looked at the media and
 * rejected it, so the user has to change the file and a retry button is a lie.
 * A `connection` failure means the platform was still working, so the same
 * payload will probably work next time. Showing both as "Error: something went
 * wrong" leaves the user guessing, and guessing wrong costs them a real post.
 *
 * The platform's own message is passed through untouched in every case. This
 * only supplies the part the platform does not say: what to do next.
 */

import type { DeliveryErrorType, PostRecipient } from "@/lib/api/types";

export interface DeliveryGuidance {
  /** One line saying what happened, in terms the user can act on. */
  headline: string;
  /** The action that will actually resolve it, or null when there is none the
   *  user can take. */
  remedy: string | null;
  /** Whether re-attempting the same payload is worth offering. */
  retryable: boolean;
  /** Whether to style this as a "fix the account" problem. */
  needsReconnect: boolean;
}

const GUIDANCE: Record<string, DeliveryGuidance> = {
  auth: {
    headline: "This connection needs to be renewed.",
    remedy: "Reconnect the account in Channels, then publish again.",
    retryable: false,
    needsReconnect: true,
  },
  validation: {
    headline: "The platform rejected this content.",
    remedy: "Change the media or format — sending the same thing again will not work.",
    retryable: false,
    needsReconnect: false,
  },
  not_supported: {
    headline: "This channel cannot publish that format.",
    remedy: "Pick a different format for this channel.",
    retryable: false,
    needsReconnect: false,
  },
  config: {
    headline: "This channel is not set up to publish.",
    remedy: "Reconnect the account, or ask an administrator to check its permissions.",
    retryable: false,
    needsReconnect: true,
  },
  not_found: {
    headline: "The post or account is no longer on the platform.",
    remedy: "It may have been deleted on the platform side. Check the account, then try again.",
    retryable: true,
    needsReconnect: false,
  },
  rate_limit: {
    headline: "The platform is rate limiting this account.",
    remedy: "Wait a few minutes, then try again.",
    retryable: true,
    needsReconnect: false,
  },
  connection: {
    headline: "The platform did not finish in time.",
    remedy: "This is usually temporary — try again.",
    retryable: true,
    needsReconnect: false,
  },
  parse: {
    headline: "The platform's response could not be read.",
    remedy: "Try again. If it keeps happening, the account's permissions may have changed.",
    retryable: true,
    needsReconnect: false,
  },
  provider_error: {
    headline: "The platform returned an error.",
    remedy: "Try again in a moment.",
    retryable: true,
    needsReconnect: false,
  },
  unknown: {
    headline: "This channel failed to publish.",
    remedy: "Try again, and check the account's connection if it keeps failing.",
    retryable: true,
    needsReconnect: false,
  },
};

const FALLBACK = GUIDANCE.unknown;

/** Guidance for one delivery. Unknown or missing types fall back rather than
 *  rendering nothing, so a new backend category degrades to generic advice
 *  instead of an empty box. */
export function deliveryGuidance(errorType?: DeliveryErrorType | string): DeliveryGuidance {
  if (!errorType) return FALLBACK;
  return GUIDANCE[errorType] ?? FALLBACK;
}

/** Whether a retry is worth offering for a post, and why not when it is not.
 *
 * Driven by the recipients rather than the post status: a post can be `failed`
 * with every channel already published (nothing to retry) and can be `failed`
 * with one channel still pending an attempt (something to retry). */
export function retryAvailability(post: {
  status: string;
  recipients: Pick<PostRecipient, "status" | "error_type">[];
}): { available: boolean; reason: string | null } {
  const failed = post.recipients.filter((r) => r.status === "failed");
  if (!failed.length) {
    return {
      available: false,
      reason: post.status === "failed" ? "No channel needs another attempt." : null,
    };
  }
  const unfixable = failed.filter((r) => !deliveryGuidance(r.error_type).retryable);
  if (unfixable.length) {
    return {
      available: false,
      reason: deliveryGuidance(unfixable[0].error_type).remedy,
    };
  }
  return { available: true, reason: null };
}

/** Channels still working, and how long they have been. */
export function isInFlight(recipient: Pick<PostRecipient, "status" | "attempted_at">): boolean {
  return recipient.status === "processing";
}

/** A short "waiting 3 min" phrase, or null when there is nothing to say. */
export function elapsedSince(iso?: string | null): string | null {
  if (!iso) return null;
  const started = Date.parse(iso);
  if (Number.isNaN(started)) return null;
  const seconds = Math.max(0, Math.round((Date.now() - started) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
