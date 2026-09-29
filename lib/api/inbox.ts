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
  sender_name: string;
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
