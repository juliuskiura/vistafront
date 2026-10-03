"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import type { SocialConversation } from "@/lib/api/inbox";
import { useApiFetch } from "@/lib/context";
import { MessageSquare } from "@/lib/icons";

import { ThreadList } from "./_components/thread-list";
import { ThreadView } from "./_components/thread-view";

/** How often the thread list refreshes while the tab is open. */
const POLL_INTERVAL_MS = 30_000;

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
  } = useQuery<SocialConversation[]>({
    // The term is part of the key so a search never paints over an unsearched
    // list, and going back to an empty box restores the full list from cache.
    queryKey: ["socialmanager-inbox", workspace, debouncedSearch],
    queryFn: () => fetchConversations(workspace, debouncedSearch, apiFetch),
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const selectThread = useCallback(
    (nanoid: string | null) => {
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
    [router, searchParams],
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
