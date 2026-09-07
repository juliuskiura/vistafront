"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, CornerDownLeft } from "lucide-react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AiOptimizerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialText?: string;
  platform?: string;
  onInsert: (text: string) => void;
  onGenerate?: (prompt: string) => Promise<string>;
}

const QUICK_ACTIONS: { key: string; label: string; instruction: string }[] = [
  {
    key: "write",
    label: "Write a post",
    instruction: "Write an engaging social media post. Keep it concise and on-brand.",
  },
  {
    key: "improve",
    label: "Improve writing",
    instruction: "Improve the clarity, tone, and engagement of the current draft without changing its meaning.",
  },
  {
    key: "shorter",
    label: "Make it shorter",
    instruction: "Rewrite the current draft to be shorter while keeping the key message.",
  },
  {
    key: "hashtags",
    label: "Add hashtags",
    instruction: "Improve the current draft and append a few relevant, high-impact hashtags.",
  },
];

function buildPrompt(
  instruction: string,
  initialText: string,
  history: ChatMessage[],
  platform?: string,
): string {
  const parts: string[] = [];
  if (platform) parts.push(`Platform: ${platform}.`);
  if (initialText.trim()) parts.push(`Current draft:\n${initialText.trim()}`);
  const conversation = history
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n");
  parts.push(`Conversation so far:\n${conversation || "(none)"}`);
  parts.push(`Instruction: ${instruction}`);
  parts.push(
    "Respond with only the resulting social media text. No commentary, no markdown code fences, and no hashtag line unless the instruction asks for one.",
  );
  return parts.join("\n\n");
}

export default function AiOptimizerSheet({
  open,
  onOpenChange,
  initialText = "",
  platform,
  onInsert,
  onGenerate,
}: AiOptimizerSheetProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, busy]);

  const send = async (instruction: string) => {
    const text = instruction.trim();
    if (!text || busy) return;
    const nextHistory = [...messages, { role: "user" as const, content: text }];
    setMessages(nextHistory);
    setInput("");
    setBusy(true);
    try {
      if (onGenerate) {
        const response = await onGenerate(
          buildPrompt(text, initialText, messages, platform),
        );
        setMessages((m) => [...m, { role: "assistant", content: response }]);
      } else {
        setMessages((m) => [
          ...m,
          {
            role: "assistant",
            content: "⚠️ AI generation is not configured.",
          },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "⚠️ The AI request failed. Check that an AI model is active and try again.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const hasModel = !!onGenerate;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            AI Optimizer
          </SheetTitle>
          <SheetDescription>
            {platform ? `Drafting for ${platform}. ` : ""}
            {hasModel
              ? "Chat with AI to generate or refine your text, then insert it."
              : "No active AI model is configured."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="text-center text-xs text-slate-400">
              Ask the AI to write, improve, or shorten your post.
            </p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1 ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-slate-100 text-slate-800 border border-slate-200"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "assistant" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => onInsert(msg.content)}
                >
                  <CornerDownLeft className="h-3 w-3" />
                  Insert
                </Button>
              )}
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-slate-200 p-3 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.key}
                type="button"
                disabled={busy || !hasModel}
                onClick={() => send(a.instruction)}
                className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              disabled={busy || !hasModel}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder={hasModel ? "Describe what you want…" : "No active AI model"}
              className="max-h-28 min-h-[40px] flex-1 resize-none text-xs"
              rows={2}
            />
            <Button
              type="button"
              size="icon"
              disabled={busy || !hasModel || !input.trim()}
              onClick={() => send(input)}
              aria-label="Send"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
