"use client";

import { Minus, MessageSquarePlus } from "lucide-react";
import { ChatIcon } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { MessageList } from "./message-list";
import { ChatInput } from "@/components/workspace/chat-input";
import type { ChatAttachment, ChatMessage } from "../types";

interface ChatPanelProps {
  messages: ChatMessage[];
  pendingAttachments: ChatAttachment[];
  online: boolean;
  hasRoom: boolean;
  starting?: boolean;
  hasPending?: boolean;
  onStart: () => void;
  onMinimize: () => void;
  onClose: () => void;
  onSend: (content: string) => void;
  onAttach: (file: File) => void;
  onTyping: (isTyping: boolean) => void;
  typing: boolean;
}

export function ChatPanel({
  messages,
  pendingAttachments,
  online,
  hasRoom,
  starting = false,
  hasPending = false,
  onStart,
  onMinimize,
  onClose,
  onSend,
  onAttach,
  onTyping,
  typing,
}: ChatPanelProps) {
  const status = starting
    ? "Connecting..."
    : hasPending
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
          {hasRoom && (
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

      <MessageList messages={messages} pendingAttachments={pendingAttachments} hasRoom={hasRoom} />

      {hasRoom ? (
        <>
          {typing && (
            <p className="px-4 pb-1 text-[11px] text-muted-foreground">
              Support is typing...
            </p>
          )}
          <ChatInput onSend={onSend} onAttach={onAttach} onTyping={onTyping} />
        </>
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