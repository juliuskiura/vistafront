"use client";

import { useEffect } from "react";

import {
  Copy,
  Heading1,
  Heading2,
  List,
  Trash2,
  Type,
} from "@/lib/icons";

/** The block types the frontapp's "Turn into" section offered. */
const TRANSFORMS = [
  { label: "Text / Paragraph", icon: Type, value: "paragraph" },
  { label: "Heading 1", icon: Heading1, value: "heading1" },
  { label: "Heading 2", icon: Heading2, value: "heading2" },
  { label: "Bullet List", icon: List, value: "bulletList" },
] as const;

export type BlockTransform = (typeof TRANSFORMS)[number]["value"];

/**
 * The block menu behind the grip: turn the block into another type,
 * duplicate it, or delete it.
 *
 * The "Turn into" section is restored from the frontapp's
 * `DragHandle.tsx` at `4c97c34^`; the Next.js port had dropped it, leaving a
 * menu that could only destroy or copy a block and no way to change its type
 * without selecting the text and reaching for the toolbar.
 *
 * A full-screen transparent button sits behind it as the dismiss layer, and
 * `Escape` closes it. Both close on *click* rather than `mousedown`, because
 * `mousedown` on the backdrop is what closes most menus and it also fires
 * before a drag that started on the grip has finished.
 */
export function BlockMenu({
  top,
  left,
  onDuplicate,
  onDelete,
  onTransform,
  onDismiss,
}: {
  top: number;
  left: number;
  onDuplicate: () => void;
  onDelete: () => void;
  onTransform: (value: BlockTransform) => void;
  onDismiss: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  return (
    <>
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onDismiss}
        className="fixed inset-0 z-50 cursor-default"
      />
      <div
        role="menu"
        className="fixed z-50 w-52 rounded-lg border bg-popover p-1.5 text-popover-foreground shadow-lg ring-1 ring-foreground/5"
        style={{ top, left }}
      >
        <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Turn into
        </p>
        {TRANSFORMS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="menuitem"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onTransform(item.value)}
            className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-accent"
          >
            <item.icon size={15} className="text-muted-foreground" />
            {item.label}
          </button>
        ))}

        <div className="mx-1 my-1.5 h-px bg-border" />

        <p className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          Actions
        </p>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDuplicate}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-xs transition-colors hover:bg-accent"
        >
          <Copy size={15} className="text-muted-foreground" />
          Duplicate
        </button>
        <button
          type="button"
          role="menuitem"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onDelete}
          className="flex w-full items-center gap-3 rounded-md px-2.5 py-2 text-left text-xs text-destructive transition-colors hover:bg-destructive/10"
        >
          <Trash2 size={15} />
          Delete
        </button>
      </div>
    </>
  );
}
