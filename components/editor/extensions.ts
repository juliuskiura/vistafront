import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Image from "@tiptap/extension-image";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";

import type { Extensions } from "@tiptap/core";

export interface CreateEditorExtensionsOptions {
  placeholder?: string;
}

/**
 * The extension stack behind the note editor.
 *
 * ## Nothing here is `draggable`
 *
 * A previous pass set `draggable: true` on every block node so ProseMirror
 * would render `draggable="true"` on the block's DOM element. That backfired
 * in the most annoying way possible: browsers only start a native HTML5 drag
 * from a `draggable` element, so *pressing on text and moving the mouse*
 * reordered the block instead of selecting the text. Every text selection
 * that started inside a paragraph was hijacked, and because the drag only
 * needed a few pixels of movement to trigger, selecting a sentence by
 * dragging across it was impossible.
 *
 * The fix is the interaction model Notion and every other block editor uses:
 * the block is never itself draggable, and the six-dot grip is the single
 * drag affordance. The grip stays `draggable` and sets `view.dragging` by
 * hand (`editor-drag-handle.tsx`), which is the field ProseMirror's own drop
 * handler reads — so the drop lands through the native code path without
 * the block hijacking pointer gestures.
 *
 * The corollary: `Image` is explicitly `draggable: false` because Tiptap's
 * image node hardcodes `draggable: true` and does not expose it as an
 * option. Left on, a click-drag on an image reorders its block instead of
 * selecting it.
 *
 * ## Colours
 *
 * `TextStyle` is the base mark every colour mark hangs off — it stores the
 * `style` attribute, and `Color` / `Highlight` set individual properties on
 * it. All three are required: `Color` alone throws at runtime without a
 * text-style mark to attach to.
 */
export function createEditorExtensions({
  placeholder = "Start writing…",
}: CreateEditorExtensionsOptions = {}): Extensions {
  return [
    StarterKit.configure({
      // Six levels, not the default three. The heading dropdown offers all
      // six, and a level the schema rejects renders as a paragraph the
      // moment the document is reloaded.
      heading: { levels: [1, 2, 3, 4, 5, 6] },

      // `target: null` rather than `_blank`: the reader renders in the same
      // tab, and the sanitizer already forces `rel="noopener noreferrer"` on
      // any link that does carry a target.
      link: {
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      },

      // The drop indicator for grip-initiated reordering. Thicker and
      // tinted with the primary accent so it reads as a placement
      // decision rather than a text selection.
      dropcursor: { color: "var(--color-primary-500)", width: 4 },
    }),

    Placeholder.configure({ placeholder }),

    // ── Colour marks ────────────────────────────────────────────────────
    // Order matters: `TextStyle` must precede the marks that write into it.
    TextStyle,
    Color,
    // `multicolor` stores the chosen colour in `style="background-color"`,
    // so a highlight survives the sanitizer and reads identically in the
    // reader. Without it every highlight is the same yellow.
    Highlight.configure({ multicolor: true }),

    // ── Blocks outside StarterKit ──────────────────────────────────────
    // Not draggable: a draggable `taskItem` would let ProseMirror pull one
    // item out of its parent list and produce an invalid document, and the
    // grip snaps to the top-level block regardless, so dragging a task
    // moves the whole list.
    TaskList,
    TaskItem.configure({ nested: true }),

    // Tiptap's Image hardcodes `draggable: true`; see the note above.
    Image.extend({ draggable: false }).configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: { loading: "lazy" },
    }),

    Table.configure({ resizable: true }),
    TableRow,
    TableHeader,
    TableCell,

    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ];
}
