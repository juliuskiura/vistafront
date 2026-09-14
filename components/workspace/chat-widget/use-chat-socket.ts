"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import type { ChatMessage } from "./types";

export function isOwnMessage(
  msg: ChatMessage,
  userName?: string | null,
): boolean {
  return msg.sender_name === "You" || (!!userName && msg.sender_name === userName);
}

interface UseChatSocketArgs {
  roomNanoid?: string;
  minimizedRef: MutableRefObject<boolean>;
  userName?: string | null;
  onUnread?: () => void;
}

export function useChatSocket({
  roomNanoid,
  minimizedRef,
  userName,
  onUnread,
}: UseChatSocketArgs) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [wsReady, setWsReady] = useState(false);
  const [hasPending, setHasPending] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const pendingMessagesRef = useRef<string[]>([]);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUnreadRef = useRef(onUnread);
  useEffect(() => {
    onUnreadRef.current = onUnread;
  }, [onUnread]);
console.log("useChatSocket", { roomNanoid, minimizedRef, userName, onUnread });
console.log("useChatSocket", { messages, wsReady, hasPending });
  const replaceHistory = useCallback((history: ChatMessage[]) => {
    setMessages(history);
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
    setMessages([]);

    if (!roomNanoid) return;

    const backendUrl = new URL(
      process.env.NEXT_PUBLIC_BACKEND_URL ?? window.location.origin,
    );
    const protocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${backendUrl.host}/ws/chat/${roomNanoid}/`;
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
              for (const content of queued) {
                sock.send(JSON.stringify({ action: "send_message", content }));
              }
            }
          }
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('dataEcho: ', data)
            if (data.type === "message") {
              setMessages((prev) => [...prev, data.message]);
              if (
                minimizedRef.current &&
                !isOwnMessage(data.message, userName)
              ) {
                onUnreadRef.current?.();
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
      pendingMessagesRef.current = [];
      setHasPending(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNanoid]);

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomNanoid) return;

      const text = content.trim();
      if (!text) return;

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ action: "send_message", content: text }),
        );
        return;
      }

      pendingMessagesRef.current.push(text);
      setHasPending(true);
    },
    [roomNanoid],
  );

  return { messages, replaceHistory, wsReady, hasPending, sendMessage };
}