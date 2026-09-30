"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Baseline, Highlighter } from "@/lib/icons";
import { cn } from "@/lib/utils";

import {
  CustomColorInput,
  HIGHLIGHT_COLORS,
  ResetButton,
  SwatchGrid,
  TEXT_COLORS,
} from "./editor-color-palette";

/**
 * Text-colour picker, bound to the `textStyle` mark.
 *
 * Tiptap stores the choice as `style="color: …"` on a text-style span, which
 * is why `extensions.ts` has to register `TextStyle` before `Color`.
 */
export function TextColorPicker({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("textStyle").color as string | undefined;

  return (
    <div className="space-y-2">
      <SwatchGrid
        colors={TEXT_COLORS}
        active={current ?? null}
        onSelect={(color) => editor.chain().focus().setColor(color).run()}
      />

      <div className="flex items-center gap-1.5 border-t pt-2">
        <CustomColorInput
          label="Custom text colour"
          value={current}
          // A rainbow tile, because the control itself is invisible.
          swatchClass="bg-gradient-to-br from-red-500 via-emerald-500 to-violet-500"
          onChange={(color) => editor.chain().focus().setColor(color).run()}
        />
        <span className="text-[11px] text-muted-foreground">Custom</span>
        <ResetButton
          label="Reset text colour"
          disabled={!current}
          onClick={() => editor.chain().focus().unsetColor().run()}
        />
      </div>
    </div>
  );
}

/** Background / highlight picker, bound to the `highlight` mark. */
export function HighlightColorPicker({ editor }: { editor: Editor }) {
  const current = editor.getAttributes("highlight").color as string | undefined;

  return (
    <div className="space-y-2">
      <SwatchGrid
        colors={HIGHLIGHT_COLORS}
        active={current ?? null}
        onSelect={(color) =>
          editor.chain().focus().setHighlight({ color }).run()
        }
      />

      <div className="flex items-center gap-1.5 border-t pt-2">
        <CustomColorInput
          label="Custom highlight colour"
          value={current}
          // Checkerboard, the universal "no colour here" signal.
          swatchClass="nb-checkerboard"
          onChange={(color) =>
            editor.chain().focus().setHighlight({ color }).run()
          }
        />
        <span className="text-[11px] text-muted-foreground">Custom</span>
        <ResetButton
          label="Remove highlight"
          disabled={!current}
          onClick={() => editor.chain().focus().unsetHighlight().run()}
        />
      </div>
    </div>
  );
}

/**
 * The toolbar trigger for the text-colour popover.
 *
 * The underline swatch under the "A" tracks the colour currently applied to
 * the selection, so the button state is readable without opening anything.
 */
export function TextColorButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const current = editor.getAttributes("textStyle").color as string | undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Preventing mousedown keeps focus — and therefore the selection —
          // in the editor while the popover is being opened.
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Text colour"
          aria-pressed={Boolean(current)}
          title="Text colour"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded transition-colors",
            current
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span className="relative flex flex-col items-center">
            <Baseline size={15} />
            <span
              aria-hidden="true"
              className="mt-0.5 h-0.5 w-3.5 rounded-full"
              style={{ backgroundColor: current ?? "currentColor" }}
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <TextColorPicker editor={editor} />
      </PopoverContent>
    </Popover>
  );
}

/** The toolbar trigger for the highlight popover. */
export function HighlightColorButton({ editor }: { editor: Editor }) {
  const [open, setOpen] = useState(false);
  const current = editor.getAttributes("highlight").color as string | undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Highlight colour"
          aria-pressed={Boolean(current)}
          title="Highlight colour"
          className={cn(
            "inline-flex size-7 items-center justify-center rounded transition-colors",
            current
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
          )}
        >
          <span className="relative flex flex-col items-center">
            <Highlighter size={15} />
            <span
              aria-hidden="true"
              className="mt-0.5 h-0.5 w-3.5 rounded-full"
              style={{ backgroundColor: current ?? "currentColor" }}
            />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        <HighlightColorPicker editor={editor} />
      </PopoverContent>
    </Popover>
  );
}
