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

/** Threads for the active workspace, newest activity first. */
export function listConversations(
  opts: ListConversationsOptions,
): Promise<SocialConversation[]> {
  const params = new URLSearchParams({ page_size: "100" });
  if (opts.unread) params.set("unread", "1");

  return serverFetch<unknown>(`${BASE}/?${params.toString()}`, {
    workspace: opts.workspace,
  }).then(unwrapConversations);
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
