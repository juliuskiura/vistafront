/**
 * What "why are no messages arriving?" reduces to, as pure functions.
 *
 * Meta pushes messages to a Page; it never lets you poll for them. That makes
 * inbound Messenger the one part of the social stack where a silent failure is
 * the *default* outcome — every lock that has to be open is opened somewhere
 * else, by someone else, and none of them leaves a trace the product can read.
 *
 * There are four of them, and they are checked in this order because each one
 * explains every symptom the ones after it could produce:
 *
 * 1. **The address.** Which Meta App holds the callback URL. Meta only delivers
 *    Page events from the app that owns the Page, so a URL registered on the
 *    Instagram app receives Instagram comments and never a single message.
 * 2. **The visitor list.** Which fields the *app* subscribes to. Nothing in the
 *    backend posts this — there is no app-level `subscribed_fields` call — so it
 *    is ticked by hand in the developer console and can only ever be displayed.
 * 3. **The register.** Whether this specific Page called
 *    `POST /{page_id}/subscribed_apps`. The backend does this on connect, but
 *    only on connect, so a Page connected before that code shipped was never
 *    registered and nothing anywhere recorded it.
 * 4. **The key.** Whether the page token carries `pages_messaging`. A platform
 *    row's `scopes` column *overrides* the provider's default list, so an
 *    operator-set value from before Messenger support silently costs the
 *    permission and every registration attempt fails on an auth error.
 *
 * Locks 3 and 4 are only observable through a live call, so they are probed
 * with `POST /pages/{nanoid}/reconnect/` rather than guessed at from the row —
 * see `ReconnectPageResult`. Locks 1, 2 and 4-when-configurable are decided
 * here from data the server already fetched, so the panel is truthful before
 * anyone presses anything.
 *
 * The mental model: a Meta App is a building. The callback URL is its address,
 * the app-level fields are the doorman's guest list, `subscribed_apps` is the
 * tenant register, and the page token's scopes are the key. Four locks, and a
 * page with a valid token can still be standing outside a locked building.
 */

import type { ManagedChannel, ReconnectPageResult, SocialMediaPlatform } from "@/lib/api/types";

/**
 * The platform row that owns Messenger.
 *
 * Not `instagramfb` (Instagram reached through a Facebook Page) and not
 * `instagram` (direct login): a Facebook Page's messages are delivered by the
 * app whose `client_id` signed the Page in, which is this row.
 */
export const MESSENGER_SLUG = "facebook";

/** The permission that lets a page token call `subscribed_apps`. */
export const MESSENGER_SCOPE = "pages_messaging";

/**
 * `ok` — proven good. `warn` — probably the cause. `bad` — definitely the
 * cause. `manual` — we cannot check this from here, only display it.
 */
export type CheckTone = "ok" | "warn" | "bad" | "manual";

export interface SetupCheck {
  id: string;
  label: string;
  tone: CheckTone;
  /** What we know, in one sentence the user can act on. */
  detail: string;
  /** The literal text an operator copies into the Meta console, when there is one. */
  value?: string;
  /** True when the check is advisory and no product code can verify it. */
  manual?: boolean;
}

/**
 * Hosts that serve a public address only while a developer's tunnel is up.
 *
 * Worth calling out on its own: a free tunnel hostname is reassigned on every
 * restart, and Meta keeps delivering to the address it was given. A rotated
 * hostname therefore stops every webhook with no error on either side — which is
 * indistinguishable, from the inbox, from a page that was never registered.
 */
const TUNNEL_HOSTS = [
  "ngrok-free.app",
  "ngrok.io",
  "trycloudflare.com",
  "loca.lt",
  "serveo.net",
  "localhost",
  "127.0.0.1",
];

/** The `facebook` platform row — the app whose console holds the callback URL. */
export function findMessengerPlatform(
  platforms: SocialMediaPlatform[] | undefined,
): SocialMediaPlatform | undefined {
  return (platforms ?? []).find((p) => p.slug === MESSENGER_SLUG);
}

/**
 * Whether a scope list asks Meta for `pages_messaging`.
 *
 * The backend accepts the list space- or comma-separated
 * (`SocialMediaPlatform.scopes` help text), so both are accepted here. A null or
 * blank list means "the provider's own defaults apply", and the Facebook
 * provider's defaults do include the scope — so blank is a pass, not a fail.
 */
export function hasMessagingScope(scopes: string | null | undefined): boolean {
  const list = (scopes ?? "")
    .split(/[\s,]+/)
    .map((scope) => scope.trim().toLowerCase())
    .filter(Boolean);
  return list.length === 0 || list.includes(MESSENGER_SCOPE);
}

/** The individual fields to tick in the developer console. */
export function parseWebhookFields(fields: string | null | undefined): string[] {
  return (fields ?? "")
    .split(/[\s,]+/)
    .map((field) => field.trim())
    .filter(Boolean);
}

function isTunnelEndpoint(endpoint: string): boolean {
  const host = endpoint.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  return TUNNEL_HOSTS.some((needle) => host.includes(needle));
}

/** Lock 1 — is there an address, and is it one that will still be there tomorrow? */
export function checkWebhookEndpoint(
  endpoint: string | null | undefined,
): SetupCheck {
  const value = (endpoint ?? "").trim();
  if (!value) {
    return {
      id: "endpoint",
      label: "Callback URL",
      tone: "bad",
      detail:
        "This platform has no webhook receiver, so no Meta event can reach us. Registering a URL somewhere else does not change that.",
    };
  }
  if (isTunnelEndpoint(value)) {
    return {
      id: "endpoint",
      label: "Callback URL",
      tone: "warn",
      detail:
        "This address is a development tunnel. Free tunnel hostnames are reassigned when the tunnel restarts, and Meta keeps delivering to the old one — so messages stop arriving with no error on either side. Fine for a test; it will break the moment the tunnel restarts.",
      value,
    };
  }
  return {
    id: "endpoint",
    label: "Callback URL",
    tone: "ok",
    detail:
      "Register this under the Meta App whose App ID is shown below — not under a different Meta App. Meta only delivers a Page's messages from the app that owns that Page.",
    value,
  };
}

/** Lock 2 — the app-level field list, which only a human in the console can set. */
export function checkWebhookFields(fields: string | null | undefined): SetupCheck {
  const parsed = parseWebhookFields(fields);
  const hasMessages = parsed.includes("messages");
  return {
    id: "fields",
    label: "Subscribed fields",
    tone: hasMessages ? "manual" : "bad",
    detail: hasMessages
      ? "Tick these under the same Meta App in Messenger → Settings → Webhooks. RegWakes stores this list for reference only — it has no way to read back what the App is actually subscribed to, so this row cannot confirm it for you."
      : "The configured field list has no `messages` in it, so Meta will send no message events. Add `messages` in the App's Messenger → Settings → Webhooks.",
    value: parsed.join(", "),
    manual: true,
  };
}

/** Lock 4, as configured — a scope list that never asked for the permission. */
export function checkMessagingScope(
  scopes: string | null | undefined,
): SetupCheck {
  const ok = hasMessagingScope(scopes);
  return {
    id: "scope",
    label: "Permission",
    tone: ok ? "ok" : "bad",
    detail: ok
      ? `The sign-in asks Meta for \`${MESSENGER_SCOPE}\`, which is what allows a page token to register the page for messages.`
      : `This platform's sign-in does not ask for \`${MESSENGER_SCOPE}\`. A page token without it is rejected by \`subscribed_apps\`, so the page can never be registered. Add the scope, then reconnect the account so a fresh token is issued.`,
  };
}

export interface PageReadiness {
  tone: CheckTone;
  label: string;
  detail: string;
  /** Whether only a browser re-auth can fix this. */
  needsReauth: boolean;
}

/**
 * Locks 3 and 4 for one connected page, from the probe's answer.
 *
 * `subscribed: false` on a token that verified is the signature of a page that
 * is connected but not registered — the single most common way to end up with a
 * permanently empty inbox, because the page looks healthy everywhere else.
 */
export function describePageReadiness(
  page: Pick<ManagedChannel, "is_active">,
  probe: ReconnectPageResult | undefined | null,
): PageReadiness {
  if (!page.is_active) {
    return {
      tone: "manual",
      label: "Disconnected",
      detail: "This page is not in use, so no messages are expected.",
      needsReauth: false,
    };
  }
  if (!probe) {
    return {
      tone: "manual",
      label: "Not checked",
      detail:
        "Press Re-subscribe to ask Meta directly: it re-mints the page token, verifies it, and re-registers the page for messages, then reports what happened.",
      needsReauth: false,
    };
  }
  if (probe.reauth) {
    return {
      tone: "bad",
      label: "Needs re-authorisation",
      detail:
        probe.reason ||
        "The account's stored login is no longer accepted. Reconnect the account in a browser to issue a new one.",
      needsReauth: true,
    };
  }
  if (!probe.ok) {
    return {
      tone: "bad",
      label: probe.verified === false ? "Token rejected" : "Not reachable",
      detail: probe.reason || "Meta could not confirm this page with the stored token.",
      needsReauth: true,
    };
  }
  if (probe.subscribed === true) {
    return {
      tone: "ok",
      label: "Registered for messages",
      detail:
        "Meta accepted `subscribed_apps` for this page just now, which also proves the token carries `pages_messaging`. If messages still do not arrive, the cause is lock 1 or 2 above, not this page.",
      needsReauth: false,
    };
  }
  if (probe.subscribed === false) {
    return {
      tone: "bad",
      label: "Connected, but not registered",
      detail:
        "The page token works, so this page can publish — but Meta will not deliver any message to it. That is what an empty inbox with a healthy Channels screen looks like.",
      needsReauth: false,
    };
  }
  return {
    tone: "manual",
    label: "No Messenger for this platform",
    detail:
      "This platform has no per-page message subscription, so there is nothing to register.",
    needsReauth: false,
  };
}

/**
 * Whether a channel is a Facebook Page that takes part in the Messenger
 * checklist.
 *
 * `door` first, `platform` second, because the backend exposes two slugs and
 * they disagree for exactly the rows this panel cares about: `platform` is the
 * slug of the platform the *account* signed in through, while `door` is the
 * channel's own slug. A Facebook Page reached through the "sign in with
 * Instagram" door therefore reports `platform: "instagramfb"` while being a
 * Facebook Page — and it is still the page Meta delivers messages to.
 */
export function isMessengerChannel(
  page: Pick<ManagedChannel, "platform" | "door">,
): boolean {
  return (page.door || page.platform) === MESSENGER_SLUG;
}
