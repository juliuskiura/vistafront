"use client";

import { Minus, MessageSquarePlus } from "lucide-react";
import { ChatIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { ChatMessage } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  online: boolean;
  hasRoom: boolean;
  userName?: string | null;
  starting?: boolean;
  closedAt?: string | null;
  onStart: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onSend: (content: string, sentAt: Date) => void;
}

export function ChatPanel({
  messages,
  online,
  hasRoom,
  userName,
  starting = false,
  closedAt,
  onStart,
  onMinimize,
  onClose,
  onSend,
}: ChatPanelProps) {
  const status = closedAt
    ? "Chat Closed"
    : starting
      ? "Connecting..."
      : online
        ? "Online"
        : hasRoom
          ? "Connecting..."
          : "Start a new chat";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[min(600px,calc(100vh-2.5rem))] w-[min(380px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between bg-gradient-to-r from-primary/90 to-primary/70 px-4 py-3.5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
            <ChatIcon size={20} />
          </span>
          <div>
            <p className="text-sm font-bold text-primary-foreground">
              Chat with Vistasolve
            </p>
            <p className="text-[11px] text-primary-foreground/70">{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasRoom && !closedAt && (
            <VSButton
              variant="destructive"
              appearance="threeD"
              size="sm"
              onClick={onClose}
            >
              Close Chat
            </VSButton>
          )}
          <button
            type="button"
            onClick={onMinimize}
            aria-label="Minimize chat"
            title="Minimize"
            className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground/90 transition-colors hover:bg-primary-foreground/15"
          >
            <Minus className="size-4" />
          </button>
        </div>
      </div>

      <MessageList messages={messages} userName={userName} hasRoom={hasRoom} />

      {closedAt ? (
        <>
          <hr className="border-sidebar-divider" />
          <div className="flex flex-1 flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              Chat closed at{" "}
              {new Date(closedAt).toLocaleString([], {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </>
      ) : hasRoom ? (
        <ChatInput onSend={onSend} />
      ) : (
        <div className="border-t border-sidebar-divider bg-background/95 p-4 backdrop-blur-sm">
          <Button
            type="button"
            variant="default"
            onClick={onStart}
            disabled={starting}
            className="w-full rounded-xl"
          >
            <MessageSquarePlus className="size-4" />
            {starting ? "Opening chat..." : "Start Conversation"}
          </Button>
        </div>
      )}
    </div>
  );
}