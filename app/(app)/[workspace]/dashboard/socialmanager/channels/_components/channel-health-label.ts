/**
 * Turn the backend's connection-health verdict into one line of card copy.
 *
 * The card used to read `token_expires_at` itself and decide the status from
 * it: `=== null` meant "Active" (which is also what a never-written token
 * looked like — indistinguishable), and any expiry floored to zero whole days
 * meant "Token expired". That math is only correct for platforms whose access
 * token *is* their lifetime. TikTok's access token lives 24 hours, so a channel
 * that had just reconnected read as expired.
 *
 * The backend now folds each platform's token model into a single `state`
 * (`connected` / `expiring` / `expired` / `no_access_token` /
 * `reconnect_required` / `unreachable`) and this module maps it — and only it —
 * to a tone, a label and a sentence. Nothing here parses token columns or
 * knows what a refresh token is.
 */

import type { ConnectionHealth } from "@/lib/api/types";

export type HealthTone = "ok" | "warn" | "bad" | "unknown";

/** Which button fixes the problem, if any. `sync` mints a fresh page token
 *  from the stored account token; only `reconnect` needs a browser. */
export type HealthRemedy = "none" | "sync" | "reconnect";

export interface ChannelHealth {
  tone: HealthTone;
  label: string;
  /** One line explaining the state, or "" when the label says it all. */
  detail: string;
  remedy: HealthRemedy;
}

const DAY_MS = 86_400_000;

/** Whole days until an ISO instant, or `null` when there is no expiry. */
function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return null;
  return Math.floor((at - Date.now()) / DAY_MS);
}

export function describeChannelHealth(
  health: ConnectionHealth | undefined,
  isActive: boolean,
): ChannelHealth {
  if (!isActive) {
    return {
      tone: "unknown",
      label: "Not in use",
      detail: "This channel is disconnected, so nothing is published to it.",
      remedy: "none",
    };
  }

  if (!health) {
    return {
      tone: "unknown",
      label: "Not checked",
      detail: "We have not assessed this channel yet.",
      remedy: "none",
    };
  }

  switch (health.state) {
    case "connected": {
      const days = daysUntil(health.expires_at);
      return {
        tone: "ok",
        label: days !== null ? `Active (${days}d left)` : "Long-lived",
        detail: health.message,
        remedy: "none",
      };
    }
    case "expiring": {
      const days = daysUntil(health.expires_at);
      return {
        tone: "warn",
        label: days !== null && days >= 1 ? `Expires in ${days}d` : "Expires soon",
        detail: health.message,
        remedy: "reconnect",
      };
    }
    case "expired":
      return {
        tone: "bad",
        label: "Expired",
        detail: health.message,
        remedy: "reconnect",
      };
    case "no_access_token":
      return {
        tone: "bad",
        label: "No access token",
        detail: health.message,
        remedy: "sync",
      };
    case "reconnect_required":
      return {
        tone: "bad",
        label: "Reconnect required",
        detail: health.message,
        remedy: "reconnect",
      };
    case "unreachable":
      return {
        tone: "bad",
        label: "Unreachable",
        detail: health.message,
        remedy: "none",
      };
  }
}
