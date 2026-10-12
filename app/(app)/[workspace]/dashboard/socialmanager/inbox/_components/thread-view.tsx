"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { senderLabel, type SocialConversationDetail } from "@/lib/api/inbox";
import { inboxSummaryKey, inboxThreadKey } from "@/lib/api/inbox-keys";
import { useApiFetch } from "@/lib/context";
import { AlertCircle, Loader } from "@/lib/icons";

import { InboxAvatar } from "./inbox-avatar";
import { MessageBubble } from "./message-bubble";
import { ReplyBox } from "./reply-box";

export interface ThreadViewProps {
  conversationId: string;
  workspace: string;
  onSent: () => void;
}

/**
 * The right pane: one thread's transcript and its composer.
 *
 * Deliberately has no `refetchInterval`. Reading a thread clears its unread
 * badge server-side (`mark_conversation_read` on retrieve), so a poll here
 * would spend requests clearing badges for threads the user may not even be
 * looking at. The transcript is refreshed in two targeted ways instead:
 * opening (or re-clicking) a thread invalidates this key, and the inbox
 * client's list poll invalidates it whenever the row's `last_message_at`
 * moves past the transcript's — so a message that arrives while the thread
 * is open appears without this query polling at all.
 */
export function ThreadView({
  conversationId,
  workspace,
  onSent,
}: ThreadViewProps) {
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();
  const transcript = useRef<HTMLDivElement>(null);

  const { data, isPending, isError, error } = useQuery<SocialConversationDetail>({
    queryKey: inboxThreadKey(workspace, conversationId),
    queryFn: () => fetchThread(conversationId, workspace, apiFetch),
    staleTime: 30_000,
  });

  // Opening a thread clears its unread badge server-side, so once its detail has
  // loaded the nav summary is stale by exactly that thread's count. Refresh it —
  // after the GET, not on selection, so the refetch cannot race the clear.
  const readThread = data?.nanoid;
  useEffect(() => {
    if (!readThread) return;
    void queryClient.invalidateQueries({
      queryKey: inboxSummaryKey(workspace),
    });
  }, [readThread, queryClient, workspace]);

  // Keep the newest message in view as the transcript grows. A plain
  // `overflow-y-auto` div rather than `ScrollArea`, which offers no way to
  // reach the scroll viewport.
  useEffect(() => {
    const node = transcript.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [data?.messages.length, isPending]);

  if (isPending) {
    return (
      <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-gray-200 bg-white">
        <Loader className="size-5 animate-spin text-gray-400" aria-hidden="true" />
        <span className="sr-only">Loading conversation</span>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <AlertCircle className="size-5 text-red-500" aria-hidden="true" />
        <p className="text-sm text-gray-600">
          {error instanceof Error
            ? error.message
            : "This conversation could not be opened."}
        </p>
      </div>
    );
  }

  // A person's name costs one platform lookup on their first message, cached
  // server-side on the sender row — so this never makes a request of its own.
  const participantName = senderLabel(
    data.participant_sender,
    data.participant_name,
    data.participant_id,
  );

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <InboxAvatar
          src={
            data.participant_sender?.picture_url ||
            data.participant_picture_url
          }
          name={participantName}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {participantName}
          </p>
          <p className="truncate text-xs text-gray-500">
            via {data.page.page_name}
          </p>
        </div>
      </header>

      <div ref={transcript} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {data.messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No messages in this thread yet.
          </p>
        ) : (
          // Oldest first — the backend already orders them this way.
          data.messages.map((message) => (
            <MessageBubble key={message.nanoid} message={message} />
          ))
        )}
      </div>

      <div className="border-t border-gray-100 p-3">
        <ReplyBox conversation={data} workspace={workspace} onSent={onSent} />
      </div>
    </div>
  );
}

async function fetchThread(
  conversationId: string,
  workspace: string,
  apiFetch: ReturnType<typeof useApiFetch>,
): Promise<SocialConversationDetail> {
  const res = await apiFetch(
    `/api/socialmanager/inbox/${conversationId}?workspace=${encodeURIComponent(workspace)}`,
  );
  if (res.status === 404) {
    throw new Error("That conversation is no longer available.");
  }
  if (!res.ok) {
    throw new Error(`The conversation could not be loaded (${res.status}).`);
  }
  const payload: unknown = await res.json();
  return payload as SocialConversationDetail;
}
