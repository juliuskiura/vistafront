"use client";

import { useEffect, useRef } from "react";
import { CheckCheck } from "lucide-react";
import { ChatIcon } from "@/lib/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { isOwnMessage } from "../use-chat-socket";
import type { ChatMessage } from "../types";

interface MessageListProps {
  messages: ChatMessage[];
  userName?: string | null;
  hasRoom: boolean;
}

export function MessageList({ messages, userName, hasRoom }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-0">
      <div className="space-y-1 px-5 py-5">
        {!hasRoom ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 opacity-60">
            <ChatIcon size={40} />
            <p className="mt-3 text-sm font-medium">Start a conversation</p>
            <p className="text-xs text-center">
              Your chat with Vistasolve will appear here once you begin
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-60">
            <ChatIcon size={40} />
            <p className="mt-3 text-sm font-medium">No messages yet</p>
            <p className="text-xs">Start a conversation below</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSent =
              isOwnMessage(msg, userName) || (!userName && !msg.sender_name);
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
                  {!isSent && msg.sender_name && (
                    <p className="mb-1 text-[11px] font-semibold text-foreground/80">
                      {msg.sender_name}
                    </p>
                  )}
                  <p className="leading-relaxed break-words">{msg.content}</p>
                  <div className="mt-1 flex items-center justify-end gap-1">
                    <p className="text-[10px] opacity-50">
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {isSent && <CheckCheck className="size-3 opacity-50" />}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}