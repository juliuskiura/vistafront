/**
 * What the channel card is allowed to claim about a channel's token.
 *
 * The card used to read `token_expires_at === null` and print "Active". For
 * every Facebook page token that null is the *normal* state — Meta mints them
 * long-lived and returns no expiry — so the branch that renders the good news
 * is the same branch that renders "we have no idea". A channel whose token was
 * never written at all therefore looked identical to a healthy one.
 *
 * The only honest signal is a live answer from the platform, so the server
 * component asks `POST /pages/{nanoid}/verify/` (which is `GET /{page_id}?fields=id`
 * with the token publishing would use) and passes the verdict down. This module
 * turns that verdict plus the stored expiry into one line of copy.
 */

/** The answer the backend gave when it checked this channel against Meta. */
export interface VerifyVerdict {
  ok: boolean;
  error?: string;
  error_type?: string;
}

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

const SYNC_HINT = "Press Sync Audience to mint a fresh token for this channel.";
const RECONNECT_HINT = "Reconnect the account to re-authorise it.";

/**
 * A backend `verify` failure caused by a missing token rather than a rejected
 * one. The two need different fixes, and the backend's own wording is the only
 * thing that distinguishes them.
 */
function isMissingToken(error: string | undefined): boolean {
  return !!error && /no access token/i.test(error);
}

export function describeChannelHealth({
  verdict,
  tokenExpiresAt,
  isActive,
}: {
  verdict: VerifyVerdict | undefined;
  tokenExpiresAt: string | null;
  isActive: boolean;
}): ChannelHealth {
  if (!isActive) {
    return {
      tone: "unknown",
      label: "Not in use",
      detail: "This channel is disconnected, so nothing is published to it.",
      remedy: "none",
    };
  }

  if (!verdict) {
    return {
      tone: "unknown",
      label: "Not checked",
      detail: "We have not asked the platform about this channel yet.",
      remedy: "none",
    };
  }

  if (!verdict.ok) {
    if (isMissingToken(verdict.error)) {
      return {
        tone: "bad",
        label: "No access token",
        detail: SYNC_HINT,
        remedy: "sync",
      };
    }
    return {
      tone: "bad",
      label: verdict.error_type === "auth" ? "Token rejected" : "Unreachable",
      detail: verdict.error || RECONNECT_HINT,
      remedy: verdict.error_type === "auth" ? "reconnect" : "none",
    };
  }

  // The platform just confirmed the token works, so the remaining question is
  // only how long it is expected to last. A null expiry on a confirmed token
  // means "long-lived", not "healthy" — say that instead of implying a
  // countdown we do not have.
  if (!tokenExpiresAt) {
    return {
      tone: "ok",
      label: "Long-lived",
      detail: "Confirmed against the platform just now. No expiry is recorded.",
      remedy: "none",
    };
  }

  const days = Math.floor((new Date(tokenExpiresAt).getTime() - Date.now()) / 86400000);
  if (days <= 0) {
    return {
      tone: "bad",
      label: "Token expired",
      detail: "The stored expiry date has passed. " + RECONNECT_HINT,
      remedy: "reconnect",
    };
  }
  if (days <= 14) {
    return {
      tone: "warn",
      label: `Expires in ${days}d`,
      detail: "Reconnect soon so scheduled posts do not fail.",
      remedy: "reconnect",
    };
  }
  return {
    tone: "ok",
    label: `Active (${days}d left)`,
    detail: "Confirmed against the platform just now.",
    remedy: "none",
  };
}
