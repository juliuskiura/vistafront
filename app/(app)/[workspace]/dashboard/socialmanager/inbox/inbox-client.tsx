"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import type {
  SocialConversation,
  SocialConversationDetail,
} from "@/lib/api/inbox";
import { inboxSummaryKey, inboxThreadKey } from "@/lib/api/inbox-keys";
import { useApiFetch } from "@/lib/context";
import { MessageSquare } from "@/lib/icons";

import { useInboxLive } from "./use-inbox-live";

import { ThreadList } from "./_components/thread-list";
import { ThreadView } from "./_components/thread-view";

/** How often the thread list refreshes while the tab is open. */
const POLL_INTERVAL_MS = 30_000;

/**
 * The backstop pace, for while the live socket is connected.
 *
 * The socket is the notification path. The poll stays behind it as the slow
 * safety net that catches the one failure a socket cannot report about
 * itself -- a connection that is technically open but silently delivers
 * nothing (a dead publisher, a Redis that accepts writes but drops the
 * pub/sub). Five minutes is fresh enough for that case and cheap enough to
 * keep; retiring it later is flipping this to `false`.
 */
const BACKSTOP_POLL_MS = 300_000;

/**
 * How long typing pauses before the list is searched.
 *
 * The search is server-side now, so every keystroke would otherwise be a round
 * trip — and the backend answers it with one request per connected channel. Half
 * a second is long enough to finish typing a name and short enough that the list
 * still feels like it is answering you.
 */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * The open thread is held in the URL as `?thread=<nanoid>`.
 *
 * A piece of local state would render just as fast, but a thread you can link
 * to and navigate back from is worth the small extra: a support agent pasting
 * a thread to a colleague is a normal thing to want, and the browser Back
 * button should walk the threads the user actually looked at.
 */
const THREAD_PARAM = "thread";

export function InboxClient({ workspace }: { workspace: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  // The debounced term is what the query runs on; `search` is what the input
  // holds. Two states rather than one so the field stays responsive while the
  // list is still on the last term the user finished typing.
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const selectedId = searchParams.get(THREAD_PARAM);

  // The workspace's live feed: one socket announcing new messages. The hook
  // owns the frame handling and the catch-up rule; this side only needs to know
  // whether the socket is up, because the poll picks its pace from it.
  const socketLive = useInboxLive(workspace, selectedId);

  useEffect(() => {
    const timer = setTimeout(
      () => setDebouncedSearch(search.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: conversations = [],
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery<SocialConversation[]>({
    // The term is part of the key so a search never paints over an unsearched
    // list, and going back to an empty box restores the full list from cache.
    queryKey: ["socialmanager-inbox", workspace, debouncedSearch],
    queryFn: () => fetchConversations(workspace, debouncedSearch, apiFetch),
    // Connected: the socket announces a new message within a second of the
    // row being stored, so the poll drops to its slow backstop pace.
    // Disconnected: the poll is the only path there is, so it keeps the
    // 30-second cadence. Either way the list never goes quiet.
    refetchInterval: socketLive ? BACKSTOP_POLL_MS : POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  // Every time the list poll lands, refresh the nav badge from the same
  // authoritative summary. This is why the layout turns its own timer off while
  // the inbox is open: the messages poll is the one that keeps "Unified Inbox"
  // in sync here, so the badge cannot lag a message the user can already see.
  useEffect(() => {
    if (!dataUpdatedAt) return;
    void queryClient.invalidateQueries({
      queryKey: inboxSummaryKey(workspace),
    });
  }, [dataUpdatedAt, queryClient, workspace]);

  // The list poll is also the open thread's doorbell. Each row carries its
  // last_message_at, so a poll that lands while a thread is open can tell the
  // transcript there is something newer than what it holds and refresh it —
  // nothing else would, because the transcript query fetches only on open and
  // on send. An inbound message would otherwise appear in the list and on the
  // badge but sit invisible in the thread the user is reading until a reload.
  //
  // The transcript is read straight from the cache rather than through state:
  // the query belongs to ThreadView, and this is the one consumer that has to
  // see through to it.
  useEffect(() => {
    if (!selectedId) return;
    const open = conversations.find((row) => row.nanoid === selectedId);
    if (!open) return;

    const transcript = queryClient.getQueryData<SocialConversationDetail>(
      inboxThreadKey(workspace, selectedId),
    );
    if (!transcript) return;

    if (isNewerMessageAt(open.last_message_at, transcript.last_message_at)) {
      void queryClient.invalidateQueries({
        queryKey: inboxThreadKey(workspace, selectedId),
      });
    }
  }, [conversations, selectedId, queryClient, workspace]);

  const selectThread = useCallback(
    (nanoid: string | null) => {
      if (nanoid) {
        // Opening a thread always refetches its transcript. Invalidation is
        // what actually forces that: `staleTime` alone would serve the cached
        // copy on a quick switch back within its 30s freshness window, and
        // re-clicking the thread already open changes nothing in the URL —
        // so without this the user has no way to refresh a thread by hand.
        // Invalidating a key with no cached entry yet is a no-op; the mount
        // fetches it anyway.
        void queryClient.invalidateQueries({
          queryKey: inboxThreadKey(workspace, nanoid),
        });
      }
      const params = new URLSearchParams(searchParams.toString());
      if (nanoid) {
        params.set(THREAD_PARAM, nanoid);
      } else {
        params.delete(THREAD_PARAM);
      }
      const query = params.toString();
      // `replace`, not `push`: opening a thread is navigation within one view,
      // and pushing would fill the Back button with every thread the user
      // clicked through on the way to the last one.
      router.replace(query ? `?${query}` : "?", { scroll: false });
    },
    [router, searchParams, queryClient, workspace],
  );

  const onSent = useCallback(() => {
    // The reply handler returns the stored message, but the thread list also
    // needs refreshing: a new outbound message changes the thread's
    // last_message_at, its preview, and its position in the list.
    // A prefix match: it invalidates the unsearched list and every searched
    // variant at once, so a reply cannot leave a stale search result on screen.
    void queryClient.invalidateQueries({
      queryKey: ["socialmanager-inbox", workspace],
    });
    // A reply also moves the thread and clears its unread badge, so the nav
    // count has to follow.
    void queryClient.invalidateQueries({
      queryKey: inboxSummaryKey(workspace),
    });
  }, [queryClient, workspace]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(280px,360px)_1fr] lg:h-[calc(100vh-16rem)]">
      <ThreadList
        conversations={conversations}
        selectedId={selectedId}
        onSelect={selectThread}
        isError={isError}
        errorMessage={isError ? describeError(error) : null}
        onRetry={() => void refetch()}
        search={search}
        onSearchChange={setSearch}
      />

      {selectedId ? (
        <ThreadView
          key={selectedId}
          conversationId={selectedId}
          workspace={workspace}
          onSent={onSent}
        />
      ) : (
        <ThreadPlaceholder hasConversations={conversations.length > 0} />
      )}
    </div>
  );
}

/**
 * Read the thread list through the Route Handler rather than `serverFetch`,
 * which is server-only. `apiFetch` is threaded in instead of called as a hook
 * here because `queryFn` is not a component; it carries the session-recovery
 * callback so a poll that meets an expired token triggers a refresh instead of
 * failing silently.
 */
async function fetchConversations(
  workspace: string,
  search: string,
  apiFetch: ReturnType<typeof useApiFetch>,
): Promise<SocialConversation[]> {
  const query = new URLSearchParams({ workspace });
  if (search) query.set("q", search);
  const res = await apiFetch(`/api/socialmanager/inbox?${query.toString()}`);
  if (!res.ok) {
    throw new Error(`Inbox request failed: ${res.status}`);
  }
  const payload: unknown = await res.json();
  return Array.isArray(payload) ? (payload as SocialConversation[]) : [];
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : "The inbox could not be loaded.";
}

/**
 * Whether the list row's last message is newer than the transcript's.
 *
 * Both timestamps come from the same server, so they compare directly. A
 * transcript without one means its query has not loaded (or the thread has
 * no message yet) — a row that has one is newer than that.
 */
function isNewerMessageAt(
  next: string | null | undefined,
  current: string | null | undefined,
): boolean {
  if (!next) return false;
  if (!current) return true;
  return new Date(next).getTime() > new Date(current).getTime();
}

function ThreadPlaceholder({ hasConversations }: { hasConversations: boolean }) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white p-8 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-primary-50 text-primary-600">
        <MessageSquare className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-gray-900">
          {hasConversations ? "Select a conversation" : "No conversations yet"}
        </p>
        <p className="mt-1 max-w-sm text-sm text-gray-500">
          {hasConversations
            ? "Pick a thread on the left to read it and reply."
            : "When someone messages one of your connected pages, the thread shows up here."}
        </p>
      </div>
    </div>
  );
}
