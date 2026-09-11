"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, CheckCheck, Paperclip, Smile } from "lucide-react";
import { ChatIcon } from "@/lib/icons";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/lib/context";

import { Button } from "@/components/ui/button";
import { Fab } from "@/components/ui/fab";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmojiPicker from "@/components/socialmanager/emoji-picker";

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

  useEffect(() => {
    if (fetchedMessages) {
      setMessages(fetchedMessages);
    }
  }, [fetchedMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          } else if (data.type === "system") {
          }
        } catch {
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

    const optimisticMessage: ChatMessage = {
      nanoid: `temp-${Date.now()}`,
      content: message.trim(),
      sender_name: "You",
      is_deleted: false,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setMessage("");

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({ action: "send_message", content: message.trim() }),
      );
    } else {
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
          <ChatIcon size={32} />
          {rooms && rooms.length > 0 && (
            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-[420px] sm:max-w-[520px] flex flex-col overflow-hidden"
        showCloseButton={false}
      >
        {/* Gradient header */}
        <div className="relative bg-gradient-to-r from-primary/90 to-primary/70 px-5 py-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChatIcon size={28} />
              <div>
                <SheetTitle className="text-base font-bold text-primary-foreground">
                  Chat with Vistasolve
                </SheetTitle>
                <p className="text-[11px] text-primary-foreground/70">
                  {wsReady ? "Online" : "Connecting..."}
                </p>
              </div>
            </div>
            <SheetClose asChild>
              <Fab variant="outline" size="sm" aria-label="Close chat">
                <X className="size-4" />
              </Fab>
            </SheetClose>
          </div>
        </div>

        {/* Premium message area */}
        <ScrollArea className="flex-1 px-0">
          <div className="space-y-1 px-5 py-5">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 opacity-60">
                <ChatIcon size={40} />
                <p className="mt-3 text-sm font-medium">No messages yet</p>
                <p className="text-xs">Start a conversation below</p>
              </div>
            )}
            {messages.map((msg, index) => {
              const isSent = msg.sender_name === "You";
              return (
                <div
                  key={msg.nanoid}
                  className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      isSent
                        ? "bg-primary text-primary-foreground rounded-br-sm"
                        : "bg-muted/80 text-muted-foreground rounded-bl-sm backdrop-blur-sm"
                    }`}
                  >
                    {!isSent && (
                      <p className="text-[11px] font-semibold mb-1 text-foreground/80">
                        {msg.sender_name}
                      </p>
                    )}
                    <p className="leading-relaxed">{msg.content}</p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <p className="text-[10px] opacity-50">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {isSent && (
                        <CheckCheck className="size-3 opacity-50" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Premium input area */}
        <div className="border-t border-sidebar-divider bg-background/95 backdrop-blur-sm p-4">
          <div className="relative flex items-center gap-1 rounded-xl border border-secondary bg-card px-3 py-2 shadow-sm transition-all focus-within:border-secondary/80 focus-within:ring-1 focus-within:ring-secondary/30">
            <EmojiPicker onEmojiSelect={(emoji) => {
                  setMessage((prev) => prev + emoji);
                }}>
                  <button
                    type="button"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                    aria-label="Emoji picker"
                  >
                    <Smile className="size-4" />
                  </button>
                </EmojiPicker>
            <div className="h-5 w-px bg-secondary" />
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
              aria-label="Attach file"
            >
              <Paperclip className="size-4" />
            </button>
            <div className="h-5 w-px bg-secondary" />
            <Textarea
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[24px] border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 focus-visible:border-none resize-none overflow-hidden"
              rows={1}
            />
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              onClick={handleSendMessage}
              disabled={!message.trim() || !wsReady}
            >
              <Send className="size-4" />
            </button>
          </div>
          {!wsReady && room && (
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              Connecting...
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
