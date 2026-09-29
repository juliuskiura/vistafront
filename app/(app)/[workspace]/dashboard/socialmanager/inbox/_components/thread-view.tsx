"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import type { SocialConversationDetail } from "@/lib/api/inbox";
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
 * badge server-side, so a background poll would quietly mark every thread read
 * while the user was looking at a different one. This query refetches only
 * when the user opens a thread or after they send a message.
 */
export function ThreadView({
  conversationId,
  workspace,
  onSent,
}: ThreadViewProps) {
  const apiFetch = useApiFetch();
  const transcript = useRef<HTMLDivElement>(null);

  const { data, isPending, isError, error } = useQuery<SocialConversationDetail>({
    queryKey: ["socialmanager-thread", workspace, conversationId],
    queryFn: () => fetchThread(conversationId, workspace, apiFetch),
    staleTime: 30_000,
  });

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

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <header className="flex items-center gap-3 border-b border-gray-100 px-4 py-3">
        <InboxAvatar
          src={data.participant_picture_url}
          name={data.participant_display_name}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">
            {data.participant_display_name}
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
  return (await res.json()) as SocialConversationDetail;
}
