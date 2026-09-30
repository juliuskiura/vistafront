"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ChevronDown,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Pilcrow,
} from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * Block-type dropdown: paragraph plus headings 1–6.
 *
 * A dropdown rather than six separate buttons because the bar already has
 * marks, links, lists, and undo on it — six heading buttons is most of a
 * second row, and levels 4–6 are rarely used enough to earn permanent
 * toolbar space. It also mirrors the control Word, Google Docs, and Notion
 * all use, so the interaction is already known.
 */
export function HeadingSelect({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const active = activeHeading(editor);
  const Option = OPTIONS.find((o) => o.key === active)!;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Keeps the editor's focus and selection alive while opening, the
          // same reason every other toolbar control prevents mousedown.
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Block type"
          title="Block type"
          className={cn(
            "inline-flex h-7 min-w-[7.5rem] items-center justify-between gap-1.5 rounded px-2 text-xs transition-colors",
            "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span className="flex items-center gap-1.5">
            <Option.icon size={14} />
            {Option.label}
          </span>
          <ChevronDown size={12} className="opacity-50" />
        </button>
      </PopoverTrigger>

      <PopoverContent align="start" className="w-56 p-1">
        <div role="menu" aria-label="Block type" className="space-y-0.5">
          {OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.label}
                type="button"
                role="menuitemradio"
                aria-checked={active === option.key}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  option.apply(editor);
                  // Explicit close rather than relying on an outside click:
                  // applying a heading re-renders the document, which can
                  // move the trigger out from under the pointer and leave
                  // the popover hanging open.
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent",
                  active === option.key
                    ? "bg-primary/10 text-primary"
                    : "text-foreground",
                )}
              >
                <Icon
                  size={14}
                  className={cn(
                    "shrink-0",
                    active === option.key ? "text-primary" : "text-muted-foreground",
                  )}
                />
                <span className={cn("truncate", option.preview)}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** Which option the dropdown should show, given the cursor's block. */
function activeHeading(editor: Editor): OptionKey {
  for (let level = 1; level <= 6; level += 1) {
    if (editor.isActive("heading", { level })) return `h${level}` as OptionKey;
  }
  return "paragraph";
}

type OptionKey = "paragraph" | "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface HeadingOption {
  key: OptionKey;
  label: string;
  icon: typeof Pilcrow;
  /** Tailwind size class for the menu row, so the menu previews the scale. */
  preview: string;
  apply: (editor: Editor) => void;
}

const OPTIONS: HeadingOption[] = [
  {
    key: "paragraph",
    label: "Paragraph",
    icon: Pilcrow,
    preview: "text-sm",
    apply: (editor) => editor.chain().focus().setParagraph().run(),
  },
  {
    key: "h1",
    label: "Heading 1",
    icon: Heading1,
    preview: "text-base font-bold",
    apply: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    key: "h2",
    label: "Heading 2",
    icon: Heading2,
    preview: "text-[0.9375rem] font-semibold",
    apply: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    key: "h3",
    label: "Heading 3",
    icon: Heading3,
    preview: "text-sm font-semibold",
    apply: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    key: "h4",
    label: "Heading 4",
    icon: Heading4,
    preview: "text-[0.8125rem] font-semibold",
    apply: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
  },
  {
    key: "h5",
    label: "Heading 5",
    icon: Heading5,
    preview: "text-xs font-semibold",
    apply: (editor) => editor.chain().focus().toggleHeading({ level: 5 }).run(),
  },
  {
    key: "h6",
    label: "Heading 6",
    icon: Heading6,
    preview: "text-[0.6875rem] font-semibold uppercase tracking-wide",
    apply: (editor) => editor.chain().focus().toggleHeading({ level: 6 }).run(),
  },
];
