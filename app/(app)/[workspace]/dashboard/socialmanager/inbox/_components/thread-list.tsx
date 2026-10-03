"use client";

import { AlertCircle, MessageSquare, Search } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { senderLabel, type SocialConversation } from "@/lib/api/inbox";

import { ThreadRow } from "./thread-row";

export interface ThreadListProps {
  conversations: SocialConversation[];
  selectedId: string | null;
  onSelect: (nanoid: string | null) => void;
  isError: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

/**
 * The left pane: every thread for the workspace.
 *
 * Filtering is not done here. The search runs on the server (`?q=`), because it
 * has to be: the endpoint's only text-adjacent filters are `?unread=1` and
 * `?page=`, and a match on message text — or on a channel name the row does not
 * carry — cannot be resolved from the rows already on screen. What arrives here
 * is the result set for the current term.
 */
export function ThreadList({
  conversations,
  selectedId,
  onSelect,
  isError,
  errorMessage,
  onRetry,
  search,
  onSearchChange,
}: ThreadListProps) {
  const term = search.trim();

  // The avatar and the row title are both the person, so the label is computed
  // once here rather than twice in `ThreadRow` with two chances to disagree.
  const labelled = conversations.map((conversation) => ({
    conversation,
    label: senderLabel(
      conversation.participant_sender,
      conversation.participant_name,
      conversation.participant_id,
    ),
  }));

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isError ? (
          <ListNotice
            tone="error"
            message={errorMessage ?? "The inbox could not be loaded."}
            action={
              <Button variant="outline" size="sm" onClick={onRetry}>
                Try again
              </Button>
            }
          />
        ) : conversations.length === 0 ? (
          <ListNotice
            tone="empty"
            icon={<MessageSquare className="size-5" aria-hidden="true" />}
            message={
              term
                ? "No conversations match that search."
                : "No conversations yet. Threads appear here when someone messages a connected page."
            }
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {labelled.map(({ conversation, label }) => (
              <li key={conversation.nanoid}>
                <ThreadRow
                  participantName={label}
                  participantPictureUrl={
                    conversation.participant_sender?.picture_url ||
                    conversation.participant_picture_url
                  }
                  preview={conversation.last_message_preview}
                  lastMessageAt={conversation.last_message_at}
                  unreadCount={conversation.unread_count}
                  needsReauth={conversation.needs_reauth}
                  channel={conversation.channel}
                  selected={conversation.nanoid === selectedId}
                  onSelect={() => onSelect(conversation.nanoid)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ListNotice({
  message,
  tone,
  icon,
  action,
}: {
  message: string;
  tone: "empty" | "error";
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const isError = tone === "error";
  return (
    <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-2 p-8 text-center">
      <span
        className={
          isError
            ? "flex size-10 items-center justify-center rounded-full bg-red-50 text-red-600"
            : "flex size-10 items-center justify-center rounded-full bg-gray-100 text-gray-500"
        }
      >
        {icon ?? (isError ? <AlertCircle className="size-5" aria-hidden="true" /> : null)}
      </span>
      <p className="text-sm text-gray-500">{message}</p>
      {action}
    </div>
  );
}
