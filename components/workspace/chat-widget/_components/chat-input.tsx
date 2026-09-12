"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker from "@/components/socialmanager/emoji-picker";

interface ChatInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled = false }: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const submit = () => {
    const content = value.trim();
    if (!content || disabled) return;
    onSend(content);
    setValue("");
    requestAnimationFrame(resize);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-sidebar-divider bg-background/95 p-4 backdrop-blur-sm">
      <div className="rounded-2xl border border-secondary/70 bg-card shadow-sm transition-all focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/30">
        <div className="px-3 pt-2.5">
          <Textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            className="flex min-h-[40px] w-full resize-none overflow-hidden border-none bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-sidebar-divider/70 px-2.5 py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              aria-label="Attach file"
            >
              <Paperclip className="size-4" />
            </button>
            <EmojiPicker onEmojiSelect={(emoji) => setValue((prev) => prev + emoji)}>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
                aria-label="Emoji picker"
              >
                <Smile className="size-4" />
              </button>
            </EmojiPicker>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim() || disabled}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-45"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}