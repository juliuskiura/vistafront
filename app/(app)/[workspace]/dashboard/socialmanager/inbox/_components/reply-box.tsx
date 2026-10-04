"use client";

import { useEffect, useState, type KeyboardEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type {
  ConstraintWarning,
  ReplyCheck,
  SocialConversationDetail,
  SocialMessage,
} from "@/lib/api/inbox";
import { useApiFetch } from "@/lib/context";
import { AlertCircle, Send } from "@/lib/icons";

import { ConstraintNotices } from "./constraint-notices";

export interface ReplyBoxProps {
  conversation: SocialConversationDetail;
  workspace: string;
  onSent: () => void;
}

/** How long to wait after the last keystroke before asking the platform. */
const CHECK_DEBOUNCE_MS = 400;

/**
 * The composer under a thread.
 *
 * A `useMutation` rather than a Server Action, because the send is a blocking
 * outbound call whose failures are worth showing inline, and the reply has to
 * land in the thread's own query cache immediately — a Server Action round
 * trip would leave the transcript frozen while Meta is being called.
 *
 * The length limit used to live here as a `MAX_LENGTH` constant. That was a
 * number with a wrong story attached: Instagram allows 1000 *bytes* and
 * Messenger 2000 characters, so one local constant either blocked valid
 * Messenger replies or waved over-long Instagram ones through to be refused by
 * Meta. The limit now comes from the platform, is shown while the user types,
 * and is enforced again by the backend on send.
 */
export function ReplyBox({ conversation, workspace, onSent }: ReplyBoxProps) {
  const [text, setText] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState<string | null>(null);
  // Soft breaches on a message that has already gone out. They are kept here
  // because the composer clears the text on success, and this is the user's
  // only chance to read what was wrong with it.
  const [sentWarnings, setSentWarnings] = useState<ConstraintWarning[]>([]);
  const apiFetch = useApiFetch();
  const queryClient = useQueryClient();

  const blocked = conversation.page.needs_reauth;
  const trimmed = text.trim();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(text), CHECK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text]);

  // What the platform would say about this draft. Debounced because it is a
  // round trip and nobody needs an answer per keystroke.
  const check = useQuery({
    queryKey: [
      "socialmanager-reply-check",
      workspace,
      conversation.nanoid,
      debounced,
    ],
    queryFn: () =>
      runCheck(conversation.nanoid, debounced, workspace, apiFetch),
    enabled: Boolean(debounced.trim()) && !blocked,
    staleTime: 30_000,
  });

  const warnings: ConstraintWarning[] = check.data?.warnings ?? [];
  const hardBreach = warnings.some((w) => w.severity === "error");

  const send = useMutation({
    mutationFn: (body: string) =>
      sendReply(conversation.nanoid, body, workspace, apiFetch),
    onSuccess: ({ message, warnings: soft }) => {
      setText("");
      setDebounced("");
      setError(null);
      setSentWarnings(soft ?? []);
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

  const canSend =
    !send.isPending && !blocked && Boolean(trimmed) && !hardBreach;

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

  // Once the user starts typing again, the old send's warnings no longer
  // describe anything on screen, so the draft's own findings take over.
  const shownWarnings =
    text === "" && sentWarnings.length > 0 ? sentWarnings : warnings;

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

      <ConstraintNotices
        warnings={shownWarnings}
        limits={check.data?.limits}
        draft={text}
      />

      {error && (
        <p role="alert" className="flex items-start gap-1.5 text-sm text-red-600">
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-gray-400">
          {hardBreach
            ? "Fix the highlighted problem to send this."
            : "Enter to send · Shift+Enter for a new line"}
        </p>
        <Button type="submit" size="sm" disabled={!canSend}>
          <Send className="size-4" aria-hidden="true" />
          {send.isPending ? "Sending…" : "Send"}
        </Button>
      </div>
    </form>
  );
}

/** `{ message, warnings }` — the stored row plus any soft breaches on it. */
type ReplyResult = {
  message: SocialMessage;
  warnings?: ConstraintWarning[];
};

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
): Promise<ReplyResult> {
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
  const body = (payload ?? {}) as SocialMessage & {
    warnings?: ConstraintWarning[];
  };
  const { warnings, ...message } = body;
  return { message: message as SocialMessage, warnings };
}

/**
 * Ask the platform what is wrong with the draft.
 *
 * A failure here is deliberately silent: this is advice, not the send, and a
 * broken advice panel must never stop someone replying.
 */
async function runCheck(
  nanoid: string,
  text: string,
  workspace: string,
  apiFetch: ReturnType<typeof useApiFetch>,
): Promise<ReplyCheck> {
  try {
    const res = await apiFetch(
      `/api/socialmanager/inbox/${nanoid}/check?workspace=${encodeURIComponent(workspace)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      },
    );
    if (!res.ok) return emptyCheck();
    const payload: unknown = await res.json().catch(() => null);
    const body = payload as Partial<ReplyCheck> | null;
    return {
      warnings: Array.isArray(body?.warnings) ? body.warnings : [],
      limits: body?.limits ?? emptyCheck().limits,
    };
  } catch {
    return emptyCheck();
  }
}

function emptyCheck(): ReplyCheck {
  return {
    warnings: [],
    limits: { max_characters: null, max_bytes: null, counts_bytes: false },
  };
}

function describeError(cause: unknown): string {
  return cause instanceof Error
    ? cause.message
    : "The reply could not be sent.";
}