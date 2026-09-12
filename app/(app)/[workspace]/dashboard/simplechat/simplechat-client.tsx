"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Send, MessageSquareDashed } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Message = {
  id: string | number;
  from: "me" | "them";
  text: string;
};

type ConnectionStatus = "connecting" | "connected" | "disconnected";

const STATUS_LABEL: Record<ConnectionStatus, { label: string; dot: string }> = {
  connecting: { label: "Connecting…", dot: "bg-amber-500" },
  connected: { label: "Connected", dot: "bg-emerald-500" },
  disconnected: { label: "Reconnecting…", dot: "bg-red-500" },
};

/**
 * SimpleChatClient
 *
 * A minimal chat widget backed by a WebSocket handshake to `ws/simplechat/rooms/`
 * (the Django endpoint does not exist yet — it is added in the next step).
 * Until the socket connects, outbound messages fall back to a local echo so
 * the page stays usable as a demo.
 */
export function SimpleChatClient() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const nextIdRef = useRef(0);
  const nextId = () => ++nextIdRef.current;

  useEffect(() => {
    const backendUrl = new URL(
      process.env.NEXT_PUBLIC_BACKEND_URL ?? window.location.origin,
    );
    const protocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${backendUrl.host}/ws/simplechat/rooms/`;
    const BASE_DELAY = 1000;
    const MAX_DELAY = 30000;
    let cancelled = false;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const scheduleReconnect = () => {
      if (cancelled) return;
      setStatus("disconnected");
      wsRef.current = null;
      const delay = Math.min(BASE_DELAY * 2 ** attempt, MAX_DELAY);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (cancelled) return;
      try {
        socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (cancelled) return;
          attempt = 0;
          setStatus("connected");
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "message") {
              const msg = data.message;
              const text =
                typeof msg?.content === "string"
                  ? msg.content
                  : typeof msg === "string"
                    ? msg
                    : JSON.stringify(msg);
              setMessages((prev) => [
                ...prev,
                { id: msg?.nanoid ?? nextId(), from: "them", text },
              ]);
            } else if (data.message) {
              setMessages((prev) => [
                ...prev,
                { id: nextId(), from: "them", text: String(data.message) },
              ]);
            }
          } catch {
            /* ignore malformed frames */
          }
        };

        // socket.onclose = () => {
        //   scheduleReconnect();
        // };

        socket.onerror = () => {
          socket?.close();
        };
      } catch {
        scheduleReconnect();
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
      socket?.close(1000, "component unmount");
      socket = null;
      wsRef.current = null;
    };
  }, []);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    const isSocketOpen = wsRef.current?.readyState === WebSocket.OPEN;
    setMessages((prev) => [
      ...prev,
      { id: nextId(), from: "me", text },
    ]);
    setDraft("");

    if (isSocketOpen) {
      wsRef.current?.send(
        JSON.stringify({ action: "send_message", content: text }),
      );
      return;
    }

    const echo: Message = {
      id: nextId(),
      from: "them",
      text: `Echo: "${text}"`,
    };
    window.setTimeout(() => {
      setMessages((prev) => [...prev, echo]);
    }, 600);
  }, [draft]);

  const canSend = draft.trim().length > 0;
  const statusView = STATUS_LABEL[status];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">SimpleChat</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A simple chat backed by /ws/simplechat/rooms/.
        </p>
      </div>

      <Card className="mx-auto flex h-[32rem] w-full max-w-2xl flex-col">
        <CardHeader className="border-b border-gray-100 py-4">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <MessageSquareDashed className="size-4 text-muted-foreground" />
            General
            <span className="ml-auto flex items-center gap-1.5 text-xs font-normal text-muted-foreground">
              <span
                className={cn("size-2 rounded-full", statusView.dot)}
                aria-hidden
              />
              {statusView.label}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-1 flex-col gap-4 p-0">
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3 p-4">
              {messages.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No messages yet. Say hello!
                </p>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
                      m.from === "me"
                        ? "self-end bg-primary text-primary-foreground"
                        : "self-start bg-muted text-foreground",
                    )}
                  >
                    {m.text}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          <div className="flex items-center gap-2 border-t border-gray-100 p-3">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSend) handleSend();
              }}
              placeholder="Type a message…"
              aria-label="Message"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSend}
              disabled={!canSend}
            >
              <Send className="size-4" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}