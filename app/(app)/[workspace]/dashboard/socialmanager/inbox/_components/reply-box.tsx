"use client";

import { useState, type KeyboardEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { SocialConversationDetail, SocialMessage } from "@/lib/api/inbox";
import { useApiFetch } from "@/lib/context";
import { AlertCircle, Send } from "@/lib/icons";

/** Mirrors the backend's own limit so the user is told before a round-trip. */
const MAX_LENGTH = 2000;

export interface ReplyBoxProps {
  conversation: SocialConversationDetail;
  workspace: string;
  onSent: () => void;
}

/**
 * The composer under a thread.
 *
 * A `useMutation` rather than a Server Action, because the send is a blocking
 * outbound call whose failures are worth showing inline, and the reply has to
 * land in the thread's own query cache immediately — a Server Action round
 * trip would leave the transcript frozen while Meta is being called.
 */
export function ReplyBox({ conversation, workspace, onSent }: ReplyBoxProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const blocked = conversation.page.needs_reauth;

  const send = useMutation({
    mutationFn: (body: string) =>
      sendReply(conversation.nanoid, body, workspace, apiFetch),
    onSuccess: (message) => {
      setText("");
      setError(null);
      queryClient.setQueryData<SocialConversationDetail>(
        ["socialmanager-thread", workspace, conversation.nanoid],
        (current) =>
          current && message?.nanoid
            ? {
                ...current,
                messages: [...current.messages, message],
                unread_count: 0,
                last_message_preview: message.text.slice(0, 140),
                last_message_at: message.sent_at ?? current.last_message_at,
              }
            : current,
      );
      onSent();
    },
    onError: (cause: unknown) => {
      setError(describeError(cause));
    },
  });

  const trimmed = text.trim();
  const tooLong = text.length > MAX_LENGTH;

  const canSend = !send.isPending && !blocked && Boolean(trimmed) && !tooLong;

  function submit() {
    if (!canSend) return;
    setError(null);
    send.mutate(trimmed);
  }

  /**
   * Enter sends, Shift+Enter breaks the line — the convention every other chat
   * composer in the product follows.
   */
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    submit();
  }

  if (blocked) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
        <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <p>
          <span className="font-medium">{conversation.page.page_name}</span> needs
          to be reconnected before you can send messages. Reconnect it from
          Channels, then come back here.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2"
    >
      <Textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a reply…"
        aria-label="Write a reply"
        rows={3}
        disabled={send.isPending}
        className="resize-none"
      />

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          {tooLong ? (
            <span className="text-red-600">
              {text.length - MAX_LENGTH} characters over the limit.
            </span>
          ) : (
            "Enter to send · Shift+Enter for a new line"
          )}
        </p>
        <Button type="submit" size="sm" disabled={!canSend}>
          <Send className="size-4" aria-hidden="true" />
          {send.isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}

/**
 * POST through the Route Handler, which returns the backend's own
 * `{"error": "..."}` body and status rather than re-wrapping it. That is what
 * lets `describeError` show Meta's actual refusal instead of a generic
 * failure.
 */
async function sendReply(
  nanoid: string,
  text: string,
  workspace: string,
  apiFetch: ReturnType<typeof useApiFetch>,
): Promise<SocialMessage> {
  const res = await apiFetch(
    `/api/socialmanager/inbox/${nanoid}/reply?workspace=${encodeURIComponent(workspace)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    },
  );

  const payload: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const error = (payload as { error?: string } | null)?.error;
    throw new Error(error || `The reply was not sent (${res.status}).`);
  }
  return (payload ?? {}) as SocialMessage;
}

function describeError(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "The reply could not be sent.";
}
