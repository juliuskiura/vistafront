import { serverFetch, serverMutate } from "./server-fetch";
import type { Paginated } from "./types";

/**
 * Server-side wrappers for the social Messenger inbox.
 *
 * Backs the viewset registered at `socialmanager/routers.py` under
 * `/apis/socialmanager/inbox/`. Every function here is a Server-Component
 * entry point; Client Components reach the same endpoints through the Route
 * Handlers under `app/api/socialmanager/inbox/`, which delegate back to these
 * wrappers so the cookie forwarding and `X-Workspace` header stay in one place.
 *
 * Deliberately NOT a `"use server"` module, like every other `lib/api/*.ts`
 * domain wrapper. The directive turns every export into a Server Action, which
 * (a) requires all of them to be `async function` declarations — these return
 * promises from `serverFetch` and are not — and (b) costs a needless RPC hop
 * when a Route Handler calls them on the same server. Only the Server Components
 * and Route Handlers above ever call these; Client Components use `useApiFetch`
 * against those handlers.
 */

const BASE = "/apis/socialmanager/inbox";

/** A non-text payload on a message: image, audio, video, file. */
export interface SocialMessageAttachment {
  url: string;
  type: string;
  title: string;
}

/**
 * One resolved sender, as the backend cached it.
 *
 * The messaging webhook names a sender id and no name at all, so the name cost
 * one `/{psid}?fields=first_name,last_name,profile_pic` read on the *first*
 * message from a person and is served from this row ever after. `profile_status`
 * is what separates "we have never asked" from "we asked and the platform had
 * nothing" — both of which arrive here with an empty `display_name`, and which
 * are worth rendering differently.
 */
export interface SocialMessageSender {
  nanoid: string | null;
  /** The platform id. A Messenger PSID, or the Page's own id on a reply. */
  external_sender_id: string;
  /** Empty when the platform would not name this sender. */
  display_name: string;
  first_name: string;
  last_name: string;
  picture_url: string;
  /** True when the sender is the connected Page rather than a person. */
  is_page: boolean;
  profile_status: "pending" | "resolved" | "unavailable";
  profile_fetched_at: string | null;
}

/**
 * One message inside a thread.
 *
 * Field names mirror `SocialMessageSerializer` exactly. Several are empty
 * strings rather than nulls on purpose (`sender_name`, `text`, `message_type`),
 * so `||` is the correct fallback and `??` is not.
 */
export interface SocialMessage {
  nanoid: string;
  /** The platform's own id (a Facebook `mid`). The idempotency key. */
  external_message_id: string;
  /** Which way it travelled relative to the Page. Drives bubble alignment. */
  direction: "inbound" | "outbound";
  /** Inbound: the person's page-scoped id. Outbound: the Page's own id. */
  sender_id: string;
  /** Legacy denormalised name. Prefer `sender.display_name`. */
  sender_name: string;
  /**
   * Whoever wrote this message — the customer inbound, the Page outbound.
   *
   * Always a key, `null` when unresolved. The backend sends it explicitly
   * rather than omitting it, so `undefined` here would mean a response from a
   * server old enough to have the bug, not "no sender".
   */
  sender: SocialMessageSender | null;
  /** Empty for attachment-only messages. */
  text: string;
  message_type: string;
  /** Already normalised by the provider — render the entries directly. */
  attachments: SocialMessageAttachment[];
  is_read: boolean;
  /** Nullable; falls back to `created_at` when absent. */
  sent_at: string | null;
  created_at: string;
}

/**
 * The channel a thread arrived on, attached to the list row.
 *
 * The list serializer does not include it — it denormalises only a preview, so
 * the inbox query never joins the page table. The client resolves it instead,
 * from the per-channel list the endpoint already supports via `?page=`.
 */
export interface ConversationChannel {
  /** The managed channel's nanoid — the `?page=` filter value. */
  nanoid: string;
  /** The channel's display name, e.g. "Vistasolve Technologies". */
  page_name: string;
  /** The door slug, e.g. `instagramfb`. Resolved to a brand for the icon. */
  platform_slug: string;
}

/** The Page a thread belongs to. Only present on the detail serializer. */
export interface SocialConversationPage {
  nanoid: string;
  page_id: string;
  page_name: string;
  /** Empty string when the channel has no platform row. */
  platform_slug: string;
  needs_reauth: boolean;
}

/** A thread row in the inbox list. */
export interface SocialConversation {
  nanoid: string;
  participant_id: string;
  /** May be empty for a thread created by a webhook delivery. */
  participant_name: string;
  /** Never empty: the backend falls back to the participant id. */
  participant_display_name: string;
  /** The resolved person, when the backend has read their profile. */
  participant_sender: SocialMessageSender | null;
  /** May be empty — render a fallback avatar rather than a broken image. */
  participant_picture_url: string;
  /** Nullable until the thread has a first message. */
  last_message_at: string | null;
  last_message_preview: string;
  unread_count: number;
  is_active: boolean;
  needs_reauth: boolean;
  /**
   * Null until the client resolves it, and null forever on a thread whose
   * channel is no longer connected — see `listConversationsByChannel`.
   */
  channel: ConversationChannel | null;
  created_at: string;
}

/**
 * The label to print for a sender or participant.
 *
 * Prefers the resolved profile name, falls back to the denormalised name from
 * the raw event, and only then to the platform id — which is what an unnamed
 * sender looks like, and is still better than a blank row. `pending` means the
 * backend has not asked the platform about this person yet, which is worth a
 * gentler label than an id: it is not that there is no name, it is that nobody
 * has looked.
 */
export function senderLabel(
  sender: SocialMessageSender | null,
  fallbackName = "",
  fallbackId = "",
): string {
  if (sender?.display_name) return sender.display_name;
  if (fallbackName) return fallbackName;
  if (sender?.profile_status === "pending") return "Messenger contact";
  return fallbackId || sender?.external_sender_id || "Unknown sender";
}

/**
 * Whether an outbound bubble should name the Page.
 *
 * False by default, and deliberately not derived from `sender.is_page`: a
 * single thread is written by one Page, so repeating its name down the
 * right-hand column is noise. Opt in when a view genuinely interleaves
 * senders — two Pages in one transcript, say — where the label carries
 * information rather than repeating it.
 */
export function showAuthorFor(message: SocialMessage): boolean {
  return message.direction === "inbound" && Boolean(message.sender?.display_name);
}

/** A thread with its message history, from the detail endpoint. */
export interface SocialConversationDetail extends SocialConversation {
  /** Oldest first. Render in array order. */
  messages: SocialMessage[];
  page: SocialConversationPage;
}

/** Unread counts for the nav badge. Not paginated. */
export interface SocialInboxSummary {
  unread_total: number;
  unread_threads: number;
  threads: number;
}

export interface ListConversationsOptions {
  workspace: string;
  /** Server-side `?unread=1` filter. */
  unread?: boolean;
  /** Server-side `?page=` filter: a managed channel nanoid. */
  channel?: string;
  /**
   * The channel descriptor to stamp on rows when `channel` is set. Internal —
   * `listConversationsWithChannels` passes the row it already holds.
   */
  channelDescriptor?: ConversationChannel;
}

/**
 * Unwrap the paginated envelope the list endpoint returns.
 *
 * Only the first page is ever read, and `page_size` is pinned to the
 * paginator's maximum, so the window is 100 threads — far more than any inbox
 * list shows.
 *
 * It deliberately does NOT follow the `next` link the way `unwrapAll` in
 * `socialmanager.ts` does. That viewset reads `?page=` as a *managed-page
 * nanoid* filter while the shared paginator also reads `?page=` as a *page
 * number*, so the two collide: following `next` would send `?page=2`, which
 * filters on a nanoid of "2" and silently returns nothing. `page_size` is
 * collision-free, so the window is widened that way instead. Re-check this
 * before adding pagination controls.
 */
function unwrapConversations(payload: unknown): SocialConversation[] {
  if (Array.isArray(payload)) return payload as SocialConversation[];
  const page = payload as Paginated<SocialConversation>;
  return Array.isArray(page?.results) ? page.results : [];
}

/**
 * A conversation row as the inbox list consumes it: the API shape, plus the
 * channel resolved client-side.
 *
 * `SocialConversation.channel` is declared `ConversationChannel | null`, so a
 * thread from any source is already a valid `ConversationRow`. The alias
 * exists so the list's props say what they mean — "a thread, possibly without a
 * channel" — instead of repeating the union at every signature.
 */
export type ConversationRow = SocialConversation;

/**
 * Threads for the active workspace, newest activity first.
 *
 * `channel` is left null here — see `listConversationsWithChannels`, which is
 * what the inbox list actually calls. This wrapper stays the single-thread
 * primitive so the per-channel resolution has something to build on.
 */
export async function listConversations(
  opts: ListConversationsOptions,
): Promise<SocialConversation[]> {
  const params = new URLSearchParams({ page_size: "100" });
  if (opts.unread) params.set("unread", "1");
  if (opts.channel) params.set("page", opts.channel);

  const rows = await serverFetch<unknown>(`${BASE}/?${params.toString()}`, {
    workspace: opts.workspace,
  }).then(unwrapConversations);

  // The list endpoint does not denormalise the channel onto each row, so it is
  // filled in from the filter that produced the row.
  return opts.channel
    ? rows.map((row) => ({ ...row, channel: opts.channelDescriptor ?? null }))
    : rows;
}

/**
 * Threads with their channel resolved, for the inbox list.
 *
 * The list endpoint deliberately denormalises only a preview so the inbox query
 * never joins the page table (see `SocialConversationSerializer`). That leaves
 * the channel unavailable per row, so this walks the connected channels and asks
 * the same endpoint once per channel, using the `?page=` filter it already
 * supports.
 *
 * It is one request per channel rather than a join, and that is the trade: a
 * workspace has a handful of channels and the list is capped at 100 threads, so
 * the fan-out is small, while a server-side join on the hot inbox path is not.
 * The requests go out together, and a channel that fails resolves to an empty
 * list rather than failing the whole inbox — one disconnected Page must not
 * blank the agent's screen.
 *
 * A thread whose channel is not in the returned set keeps `channel: null`. That
 * happens when the channel was disconnected but the thread survives, and the row
 * then renders without a channel badge rather than a wrong one.
 */
export async function listConversationsWithChannels(
  opts: ListConversationsOptions & {
    /** Connected channels to attribute threads to. */
    channels: readonly ConversationChannel[];
  },
): Promise<SocialConversation[]> {
  const { channels, ...listOpts } = opts;
  if (channels.length === 0) {
    return listConversations(listOpts).then((rows) =>
      rows.map((row) => ({ ...row, channel: null })),
    );
  }

  // `page_size` is not passed alongside `?page=`: that query key means two
  // things here — the channel filter to this viewset, and the page number to
  // the shared paginator — so the two collide. Asking for the channel only
  // keeps the default page size and lets the backend order and cap the list.
  const perChannel = await Promise.all(
    channels.map(async (channel) => {
      try {
        return await listConversations({
          ...listOpts,
          channel: channel.nanoid,
          channelDescriptor: channel,
        });
      } catch {
        return [] as SocialConversation[];
      }
    }),
  );

  // One dedupe pass: a thread is on exactly one channel, but a redelivery or a
  // concurrent insert can land in two channel windows before the first write
  // settles. The first channel to claim a thread wins, which is deterministic
  // because the map preserves the order `channels` was given in.
  const seen = new Set<string>();
  const merged: SocialConversation[] = [];
  for (const rows of perChannel) {
    for (const row of rows) {
      if (seen.has(row.nanoid)) continue;
      seen.add(row.nanoid);
      merged.push(row);
    }
  }

  // Re-sort client-side: the per-channel windows each arrive newest-first, so
  // concatenating them would group by channel rather than by recency. `Date`
  // handles both null and ISO forms, and a null sorts last.
  return merged.sort(
    (a, b) =>
      new Date(b.last_message_at ?? b.created_at).getTime() -
      new Date(a.last_message_at ?? a.created_at).getTime(),
  );
}

/**
 * One thread with its messages.
 *
 * NOTE: this is a GET with a write side effect — the backend clears the
 * unread badge. Never put it on an automatic `refetchInterval`, or a poll
 * would mark threads read while the user is not looking at them.
 */
export function getConversation(
  nanoid: string,
  workspace: string,
): Promise<SocialConversationDetail> {
  return serverFetch<SocialConversationDetail>(`${BASE}/${nanoid}/`, {
    workspace,
  });
}

/** Unread totals for the nav badge. Cheap enough to poll. */
export function getInboxSummary(workspace: string): Promise<SocialInboxSummary> {
  return serverFetch<SocialInboxSummary>(`${BASE}/summary/`, { workspace });
}

/**
 * Send a reply into a thread.
 *
 * A blocking outbound Graph call, so the caller must show a pending state.
 *
 * @throws `ServerFetchError` with status 400 for blank or over-long text,
 *   409 when the Page is disconnected or has no messaging provider, and 502
 *   when the platform call fails. All carry `{ error: string }` in the body.
 */
export function replyToConversation(
  nanoid: string,
  text: string,
  workspace: string,
): Promise<SocialMessage> {
  return serverMutate<SocialMessage>(`${BASE}/${nanoid}/reply/`, {
    method: "POST",
    body: { text },
    workspace,
  });
}
