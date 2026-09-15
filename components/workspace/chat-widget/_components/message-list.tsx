"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Check, CheckCheck } from "lucide-react";
import { ChatIcon } from "@/lib/icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatAttachment, ChatMessage } from "../types";

const SUPPORT_LOGO_URL =
  "https://vsregmedia.s3.amazonaws.com/branding/icon_tn0FNHi.svg";

interface MessageListProps {
  messages: ChatMessage[];
  attachments: ChatAttachment[];
  hasRoom: boolean;
}

export function MessageList({ messages, attachments, hasRoom }: MessageListProps) {
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
            if (msg.is_system) {
              return (
                <div
                  key={msg.nanoid}
                  className="flex items-center gap-2 border-t border-slate-200 px-2 py-2 text-center"
                >
                  <span className="flex-1 text-xs text-muted-foreground">
                    {msg.content}
                  </span>
                </div>
              );
            }
            const isCustomer = msg.source === "customer";
            return (
              <div
                key={msg.nanoid}
                className={`flex items-end gap-2 ${isCustomer ? "justify-end" : "justify-start"}`}
              >
                {!isCustomer && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={SUPPORT_LOGO_URL}
                    alt="Vistasolve"
                    className="size-7 shrink-0 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
                  />
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-2 py-1 text-sm shadow-sm ${
                    isCustomer
                      ? "rounded-br-sm bg-primary-600 text-white shadow-primary/20"
                      : "rounded-bl-sm border border-amber-200 bg-amber-50 text-slate-900"
                  }`}
                >
                  {!isCustomer && msg.sender_name && (
                    <p className="mb-1 text-[11px] font-semibold text-slate-700">
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
                    {isCustomer && (msg.is_read ? (
                      <CheckCheck className="size-3 opacity-50" />
                    ) : (
                      <Check className="size-3 opacity-50" />
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {attachments.map((attachment) => (
          <div key={attachment.nanoid} className="flex items-end justify-end gap-2">
            <a
              href={attachment.file}
              target="_blank"
              rel="noreferrer"
              className="block max-w-[75%] overflow-hidden rounded-2xl rounded-br-sm border border-primary/20 bg-primary-50 p-1 shadow-sm"
            >
              <Image
                src={attachment.file}
                alt={attachment.file_name ?? "Attached image"}
                width={640}
                height={480}
                className="block h-auto max-h-72 w-auto rounded-xl object-cover"
              />
            </a>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}