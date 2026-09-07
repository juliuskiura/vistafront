"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Hash, ImagePlus, Smile, Sparkles, X, Link2, HelpCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import EmojiPicker from "./emoji-picker";
import HashtagPicker from "./hashtag-picker";
import AiOptimizerSheet from "./ai-optimizer-sheet";
import type { Asset } from "@/lib/api/types";

export interface SocialMediaTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  charLimit?: number | null;
  showCharCount?: boolean;
  mediaUrls?: string[];
  onRemoveMedia?: (index: number) => void;
  onAddMedia?: () => void;
  maxMedia?: number;
  hashtags?: string[];
  onAddHashtag?: (tag: string) => void;
  onRemoveHashtag?: (index: number) => void;
  hashtagCharLimit?: number | null;
  platform?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  minRows?: number;
  className?: string;
  headerSlot?: React.ReactNode;
  emptyMediaHint?: string;
  bare?: boolean;
  platformOptimize?: string;
  mediaAssets?: Asset[];
  platformSlug?: string;
  contentFormat?: string;
  onAttachRendition?: (asset: { nanoid: string; original_file: string }) => void;
  showLinkShortener?: boolean;
  onShortenLinks?: () => void;
  firstComment?: string;
  onFirstCommentChange?: (value: string) => void;
  onFirstCommentAi?: () => void;
}

export default function SocialMediaTextEditor({
  value,
  onChange,
  placeholder = "What do you want to share?",
  charLimit = null,
  showCharCount = true,
  mediaUrls = [],
  onRemoveMedia,
  onAddMedia,
  maxMedia,
  hashtags = [],
  onAddHashtag,
  onRemoveHashtag,
  hashtagCharLimit = null,
  disabled = false,
  autoFocus = false,
  minRows = 3,
  className,
  headerSlot,
  bare = false,
  platformOptimize,
  showLinkShortener = false,
  onShortenLinks,
  firstComment,
  onFirstCommentChange,
  onFirstCommentAi,
}: SocialMediaTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: value.length, end: value.length });
  const [aiOpen, setAiOpen] = useState(false);

  const overLimit = charLimit != null && value.length > charLimit;
  const canAddMore = !maxMedia || mediaUrls.length < maxMedia;
  const showFirstComment = firstComment !== undefined;

  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [value, resize]);

  const captureSelection = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    selectionRef.current = { start: el.selectionStart, end: el.selectionEnd };
  }, []);

  const insertText = useCallback(
    (text: string) => {
      const { start, end } = selectionRef.current;
      const next = value.slice(0, start) + text + value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          const pos = start + text.length;
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(pos, pos);
        }
      });
    },
    [onChange, value],
  );

  const insertEmoji = useCallback((emoji: string) => insertText(emoji), [insertText]);

  return (
    <div
      className={cn(
        !bare && "rounded-2xl border border-slate-200 bg-white overflow-hidden transition-colors",
        overLimit && !bare ? "border-rose-300 ring-1 ring-rose-200" : "",
        !bare && "focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-200",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      {headerSlot && (
        <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-1">{headerSlot}</div>
      )}

      <div className="px-4 pt-3">
        <textarea
          ref={textareaRef}
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onSelect={captureSelection}
          onClick={captureSelection}
          onKeyUp={captureSelection}
          onBlur={captureSelection}
          rows={minRows}
          className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-slate-900 placeholder:text-slate-400 focus:outline-none"
          style={{ minHeight: `${minRows * 1.75}rem` }}
        />
      </div>

      {(mediaUrls.length > 0 || (onAddMedia && canAddMore)) && (
        <div className="flex flex-wrap gap-2 px-4 pb-3">
          {mediaUrls.map((url, i) => (
            <div
              key={i}
              className="group relative size-20 overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img src={url} alt="" className="h-full w-full object-cover" />
              {onRemoveMedia && (
                <button
                  type="button"
                  onClick={() => onRemoveMedia(i)}
                  aria-label="Remove media"
                  className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-full bg-slate-900/75 text-white opacity-0 transition-opacity hover:bg-rose-600 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
          ))}
          {onAddMedia && canAddMore && (
            <button
              type="button"
              onClick={onAddMedia}
              disabled={disabled}
              className="group flex size-20 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 bg-[#FAFAFA] text-slate-500 transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="relative">
                <ImagePlus className="size-6" />
                <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <Plus className="size-3" />
                </span>
              </span>
              <span className="text-xs">Add Media</span>
            </button>
          )}
        </div>
      )}

      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {hashtags.map((ht, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 border border-indigo-200"
            >
              {ht}
              {onRemoveHashtag && (
                <button
                  type="button"
                  onClick={() => onRemoveHashtag(i)}
                  aria-label="Remove hashtag"
                  className="text-indigo-400 hover:text-rose-600 font-bold"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
        <div className="flex items-center gap-1">
          <EmojiPicker onEmojiSelect={insertEmoji}>
            <button
              type="button"
              disabled={disabled}
              aria-label="Insert emoji"
              title="Insert emoji"
              className="flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-amber-500 disabled:cursor-not-allowed"
            >
              <Smile className="size-5" />
            </button>
          </EmojiPicker>

          {onAddHashtag && (
            <HashtagPicker
              onHashtagSelect={onAddHashtag}
              platformCharLimit={hashtagCharLimit}
              currentContent={value}
              existingTags={hashtags}
            >
              <button
                type="button"
                disabled={disabled}
                aria-label="Add hashtag"
                title="Add hashtag"
                className="ml-1 flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-indigo-600 disabled:cursor-not-allowed"
              >
                <Hash className="size-5" />
              </button>
            </HashtagPicker>
          )}

          {showLinkShortener && (
            <button
              type="button"
              disabled={disabled || !onShortenLinks}
              aria-label="Shorten links"
              title={onShortenLinks ? "Shorten links in this post" : "Link shortener unavailable"}
              className="ml-1 flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Link2 className="size-5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            title="AI Optimizer"
            onClick={() => setAiOpen(true)}
            className="gap-1.5"
          >
            <Sparkles className="size-4 text-indigo-500" />
            <span className="text-xs">AI</span>
          </Button>
          {showCharCount && (
            <span
              className={cn(
                "text-[11px] tabular-nums select-none",
                overLimit ? "font-bold text-rose-500" : "text-slate-400",
              )}
            >
              {value.length}
              {charLimit != null && `/${charLimit}`}
            </span>
          )}
        </div>
      </div>

      {showFirstComment && (
        <>
          <div className="border-t border-slate-200" />
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              First Comment
              <span
                title="A first comment is posted immediately after the post goes live. Use it for links, CTAs, or context that shouldn't sit in the caption."
                className="text-slate-400"
              >
                <HelpCircle className="size-3.5" />
              </span>
            </div>
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                value={firstComment}
                disabled={disabled}
                onChange={(e) => onFirstCommentChange?.(e.target.value)}
                placeholder="Your comment"
                className="w-full rounded-full border border-slate-200 bg-white py-1.5 pl-4 pr-10 text-xs text-slate-900 placeholder:text-[#9CA3AF] focus:outline-none focus:border-indigo-500 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                disabled={disabled}
                aria-label="Generate first comment with AI"
                title="Generate first comment with AI"
                onClick={() => onFirstCommentAi?.()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full text-indigo-500 transition-colors hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Sparkles className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}

      <AiOptimizerSheet
        open={aiOpen}
        onOpenChange={setAiOpen}
        initialText={value}
        platform={platformOptimize}
        onInsert={(text) => {
          insertText(text);
          setAiOpen(false);
        }}
      />
    </div>
  );
}
