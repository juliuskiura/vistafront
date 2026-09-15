"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Paperclip, Send, Smile } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import EmojiPicker from "@/components/socialmanager/emoji-picker";

interface ChatInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onSend: (content: string) => void;
  onAttach?: (file: File) => void;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  typing?: boolean;
  typingLabel?: string;
  statusMessage?: React.ReactNode;
  variant?: "customer" | "admin";
}

export function ChatInput({
  value: controlledValue,
  onChange,
  onSend,
  onAttach,
  onTyping,
  disabled = false,
  typing = false,
  typingLabel,
  statusMessage,
  variant = "customer",
}: ChatInputProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState("");
  const value = controlledValue ?? uncontrolledValue;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isAdmin = variant === "admin";

  const resize = useCallback(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [resize, value]);

  const setValue = (nextValue: string) => {
    if (controlledValue === undefined) setUncontrolledValue(nextValue);
    onChange?.(nextValue);
  };

  const submit = () => {
    const content = value.trim();
    if (!content || disabled) return;
    onSend(content);
    onTyping?.(false);
    setValue("");
    requestAnimationFrame(resize);
  };

  const handleChange = (content: string) => {
    setValue(content);
    onTyping?.(content.trim().length > 0);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (content.trim()) {
      typingTimerRef.current = setTimeout(() => onTyping?.(false), 3000);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  const input = (
    <>
      {typing && typingLabel && (
        <p className={isAdmin ? "px-3 pt-2 text-[11px] text-slate-500" : "px-4 pb-1 text-[11px] text-muted-foreground"}>
          {typingLabel}
        </p>
      )}
      <div className="px-3 pt-2.5">
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={() => onTyping?.(false)}
          onKeyDown={handleKeyDown}
          rows={1}
          className="flex min-h-[40px] max-h-[160px] w-full resize-none overflow-y-auto border-none bg-transparent p-0 text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>
      <div className={isAdmin ? "flex items-center justify-between border-t border-slate-100 px-2.5 py-1.5" : "flex items-center justify-between gap-2 border-t border-sidebar-divider/70 px-2.5 py-1.5"}>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className={isAdmin ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-45" : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground disabled:opacity-45"}
            aria-label="Choose image"
            title="Choose image"
          >
            <Paperclip className={isAdmin ? "h-4 w-4" : "size-4"} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onAttach?.(file);
              event.target.value = "";
            }}
          />
          <EmojiPicker onEmojiSelect={(emoji) => setValue(`${value}${emoji}`)}>
            <button
              type="button"
              className={isAdmin ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900" : "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"}
              aria-label="Emoji picker"
              title="Insert emoji"
            >
              <Smile className={isAdmin ? "h-4 w-4" : "size-4"} />
            </button>
          </EmojiPicker>
          {statusMessage}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim() || disabled}
          aria-label="Send message"
          className={isAdmin ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:pointer-events-none disabled:opacity-45" : "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-45"}
        >
          <Send size={12} />
        </button>
      </div>
    </>
  );

  return isAdmin ? (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm transition-all focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-300/30">
      {input}
    </div>
  ) : (
    <div className="border-t border-sidebar-divider bg-background/95 p-4 backdrop-blur-sm">
      <div className="rounded-2xl border border-secondary/70 bg-card shadow-sm transition-all focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/30">
        {input}
      </div>
    </div>
  );
}
