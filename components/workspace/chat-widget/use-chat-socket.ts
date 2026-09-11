"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react";
import { useToast } from "@/lib/context";
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
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onUnreadRef = useRef(onUnread);
  useEffect(() => {
    onUnreadRef.current = onUnread;
  }, [onUnread]);
  const { push: toast } = useToast();

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

    if (!roomNanoid) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${roomNanoid}/`;
    let cancelled = false;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (cancelled) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (!cancelled) setWsReady(true);
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
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
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomNanoid]);

  const sendMessage = useCallback(
    (content: string, overrideRoomNanoid?: string) => {
      const targetNanoid = overrideRoomNanoid ?? roomNanoid;
      if (!targetNanoid) return;

      const text = content.trim();
      if (!text) return;

      if (
        !overrideRoomNanoid &&
        wsRef.current?.readyState === WebSocket.OPEN
      ) {
        wsRef.current.send(
          JSON.stringify({ action: "send_message", content: text }),
        );
        return;
      }

      fetch(
        `/api/livechat/messages?room=${targetNanoid}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        },
      ).catch(() => {
        toast({ variant: "error", message: "Failed to send message" });
      });
    },
    [roomNanoid, toast],
  );

  return { messages, replaceHistory, wsReady, sendMessage };
}