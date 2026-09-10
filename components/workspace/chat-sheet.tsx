"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { ChatIcon } from "@/lib/icons";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChatMessage {
  nanoid: string;
  content: string;
  sender_name: string | null;
  is_deleted: boolean;
  created_at: string;
}

interface ChatRoom {
  nanoid: string;
  is_active: boolean;
  agent_name: string | null;
  customer_name: string | null;
}

export function ChatSheet({ workspaceDomain }: { workspaceDomain: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [wsReady, setWsReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const { push: toast } = useToast();

  const { data: rooms } = useQuery<ChatRoom[]>({
    queryKey: ["chatRooms", workspaceDomain],
    queryFn: () =>
      fetch(`/api/livechat/rooms?workspace=${workspaceDomain}`).then((r) =>
        r.json(),
      ),
    enabled: open,
    refetchInterval: open ? 30000 : false,
  });

  const { data: fetchedMessages } = useQuery<ChatMessage[]>({
    queryKey: ["chatMessages", room?.nanoid],
    queryFn: () =>
      fetch(
        `/api/livechat/messages?room=${room?.nanoid}&workspace=${workspaceDomain}`,
      ).then((r) => r.json()),
    enabled: !!room?.nanoid && open,
    refetchInterval: open ? 15000 : false,
  });

  // Update local messages when fetched messages change
  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket connection
  useEffect(() => {
    if (!room?.nanoid || !open) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWs(null);
        setWsReady(false);
      }
      return;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws/chat/${room.nanoid}/`;

    try {
      const websocket = new WebSocket(wsUrl);
      wsRef.current = websocket;
      setWs(websocket);

      websocket.onopen = () => {
        setWsReady(true);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "message") {
            setMessages((prev) => [...prev, data.message]);
          } else if (data.type === "typing") {
            // Handle typing indicator if needed
          } else if (data.type === "system") {
            // Handle system messages
          }
        } catch {
          // Ignore parse errors
        }
      };

      websocket.onclose = () => {
        setWsReady(false);
        wsRef.current = null;
        setWs(null);
      };

      websocket.onerror = () => {
        setWsReady(false);
      };
    } catch {
      // WebSocket not available
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [room?.nanoid, open]);

  const handleSendMessage = useCallback(() => {
    if (!message.trim() || !room?.nanoid) return;

    // Optimistic send
    const optimisticMessage: ChatMessage = {
      nanoid: `temp-${Date.now()}`,
      content: message.trim(),
      sender_name: "You",
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "send_message", content: message.trim() }),
      );
    } else {
      // Fallback: send via Route Handler
      fetch(`/api/livechat/messages?room=${room.nanoid}&workspace=${workspaceDomain}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message.trim() }),
      }).catch(() => {
        toast({ variant: "error", message: "Failed to send message" });
      });
    }
  }, [message, room, workspaceDomain]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Open chat"
          className="relative"
        >
          <ChatIcon />
          {rooms && rooms.length > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Chat</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-3 py-4">
            {messages.map((msg) => (
              <div
                key={msg.nanoid}
                className={`flex ${msg.sender_name === "You" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    msg.sender_name === "You"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1">
                    {msg.sender_name}
                  </p>
                  <p>{msg.content}</p>
                  <p className="text-[10px] opacity-60 mt-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSendMessage}
              disabled={!message.trim() || !wsReady}
            >
              <Send className="size-4" />
            </Button>
          </div>
          {!wsReady && room && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Connecting...
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
