"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { ChatAttachment, ChatMessage } from "./types";
import { useTabNotification } from "@/hooks/use-tab-notification";
import { getWebSocketUrl } from "@/lib/env";

export function isOwnMessage(
  msg: ChatMessage,
  userName?: string | null,
): boolean {
  return msg.source === "customer" || msg.sender_name === "You" || (!!userName && msg.sender_name === userName);
}

function uniqueMessages(messages: ChatMessage[]) {
  return Array.from(
    new Map(messages.map((message) => [message.nanoid, message])).values(),
  );
}

interface UseChatSocketArgs {
  roomNanoid?: string;
  minimizedRef: MutableRefObject<boolean>;
  userName?: string | null;
  onUnread?: () => void;
  onAttachment?: (attachment: ChatAttachment) => void;
  onRoomClosed?: () => void;
}

export function useChatSocket({
  roomNanoid,
  minimizedRef,
  userName,
  onUnread,
  onAttachment,
  onRoomClosed,
}: UseChatSocketArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wsReady, setWsReady] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const [typingSource, setTypingSource] = useState<ChatMessage["source"] | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<
    { content: string; attachment_nanoids?: string[] }[]
  >([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUnreadRef = useRef(onUnread);
  const onAttachmentRef = useRef(onAttachment);
  const onRoomClosedRef = useRef(onRoomClosed);
  const {
    notify: notifyTab,
    clear: clearTabNotification,
  } = useTabNotification();
  const markRead = useCallback(
    (messageNanoid: string) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({
          action: "mark_read",
          message_nanoid: messageNanoid,
        }),
      );
    },
    [],
  );
  useEffect(() => {
    onUnreadRef.current = onUnread;
  }, [onUnread]);
  useEffect(() => {
    onAttachmentRef.current = onAttachment;
  }, [onAttachment]);
  useEffect(() => {
    onRoomClosedRef.current = onRoomClosed;
  }, [onRoomClosed]);
  const replaceHistory = useCallback((history: ChatMessage[]) => {
    setMessages(uniqueMessages(history));
  }, []);

  useEffect(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    // Reset the local transcript when the active room changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([]);

    if (!roomNanoid) return;

    const wsUrl = getWebSocketUrl(`/ws/chat/${roomNanoid}/`);
    let cancelled = false;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (cancelled) return;
      try {
        const sock = new WebSocket(wsUrl);
        socket = sock;
        wsRef.current = sock;

        sock.onopen = () => {
          if (!cancelled) {
            setWsReady(true);
            if (pendingMessagesRef.current.length > 0) {
              const queued = [...pendingMessagesRef.current];
              pendingMessagesRef.current = [];
              setHasPending(false);
              for (const pending of queued) {
                sock.send(
                  JSON.stringify({
                    action: "send_message",
                    content: pending.content,
                    attachment_nanoids: pending.attachment_nanoids,
                  }),
                );
              }
            }
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message") {
              setMessages((prev) =>
                prev.some((message) => message.nanoid === data.message.nanoid)
                  ? prev
                  : [...prev, data.message],
              );
              const isIncoming = !isOwnMessage(data.message, userName);
              if (isIncoming) {
                setTypingSource(null);
                if (typingTimeoutRef.current) {
                  clearTimeout(typingTimeoutRef.current);
                  typingTimeoutRef.current = null;
                }
                if (minimizedRef.current || document.visibilityState !== "visible") {
                  onUnreadRef.current?.();
                  notifyTab();
                } else {
                  markRead(data.message.nanoid);
                }
              }
            } else if (data.type === "attachment_added") {
              onAttachmentRef.current?.(data.attachment);
            } else if (data.type === "room_closed") {
              onRoomClosedRef.current?.();
            } else if (data.type === "message_read") {
              setMessages((prev) => {
                const next = prev.map((message) =>
                  message.nanoid === data.message_nanoid
                    ? { ...message, is_read: true }
                    : message,
                );
                if (
                  next
                    .filter((message) => !isOwnMessage(message, userName))
                    .every((message) => message.is_read)
                ) {
                  clearTabNotification();
                }
                return next;
              });
            } else if (data.type === "typing") {
              if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
              }
              const remoteTyping = data.source === "admin" && data.is_typing;
              setTypingSource(remoteTyping ? "admin" : null);
              if (remoteTyping) {
                typingTimeoutRef.current = setTimeout(() => {
                  setTypingSource(null);
                  typingTimeoutRef.current = null;
                }, 3000);
              }
            }
          } catch {
            /* ignore malformed frames */
          }
        };

        socket.onclose = () => {
          if (cancelled) return;
          setWsReady(false);
          wsRef.current = null;
          reconnectTimerRef.current = setTimeout(connect, 3000);
        };

        socket.onerror = () => {
          setWsReady(false);
        };
      } catch {
        reconnectTimerRef.current = setTimeout(connect, 3000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setWsReady(false);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
      setTypingSource(null);
      pendingMessagesRef.current = [];
      setHasPending(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNanoid]);

  const sendMessage = useCallback(
    (content: string, attachmentNanoids?: string[]) => {
      if (!roomNanoid) return;

      const text = content.trim();
      if (!text) return;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            action: "send_message",
            content: text,
            attachment_nanoids: attachmentNanoids?.length
              ? attachmentNanoids
              : undefined,
          }),
        );
        return;
      }

      pendingMessagesRef.current.push({
        content: text,
        attachment_nanoids: attachmentNanoids?.length
          ? attachmentNanoids
          : undefined,
      });
      setHasPending(true);
    },
    [roomNanoid],
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (wsRef.current?.readyState !== WebSocket.OPEN) return;
      wsRef.current.send(
        JSON.stringify({ action: "typing", is_typing: isTyping }),
      );
    },
    [],
  );

  return {
    messages,
    replaceHistory,
    wsReady,
    hasPending,
    sendMessage,
    markRead,
    sendTyping,
    typingSource,
  };
}