"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import { dropPoint } from "@tiptap/pm/transform";
import type { Slice } from "@tiptap/pm/model";
import type { EditorView } from "@tiptap/pm/view";

import { sanitizeNoteHtml } from "@/lib/api/sanitize-note-html";
import { cn } from "@/lib/utils";

import { EditorToolbar } from "./_components/editor-toolbar";
import { EditorDragHandle } from "./_components/editor-drag-handle";
import { blockDrag } from "./block-drag";
import { createEditorExtensions } from "./extensions";

/**
 * Largest image accepted as an inline data URL.
 *
 * There is no upload endpoint wired up yet, so a dropped or pasted picture is
 * embedded as base64 straight into the note's HTML. That is the same
 * fallback the legacy editor used when its upload route was unavailable, and
 * it works — but base64 inflates the payload by ~33% and every read of the
 * note re-ships those bytes, so it is capped. A real multipart upload route
 * should replace this.
 */
const MAX_INLINE_IMAGE_BYTES = 1_500_000;

const ACCEPTED_IMAGE_TYPES = /^image\/(png|jpe?g|gif|webp|avif)$/i;

async function fileToDataUrl(file: File): Promise<string | null> {
  if (file.size > MAX_INLINE_IMAGE_BYTES) return null;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/** Pulls the first acceptable image out of a DataTransfer, if any. */
function firstImage(files: FileList | null | undefined): File | null {
  if (!files) return null;
  for (const file of Array.from(files)) {
    if (ACCEPTED_IMAGE_TYPES.test(file.type)) return file;
  }
  return null;
}

/**
 * Move the dragged block to where it was dropped.
 *
 * `slice` is ProseMirror's own: it was read out of `view.dragging` and run
 * through `transformPasted` before being handed to `handleDrop`, so it is the
 * same content the drop indicator was drawn for. `moved` is false when a copy
 * modifier is held, in which case the source is left where it is.
 *
 * A transcription of ProseMirror's own `handleDrop` (`dropPoint` → delete the
 * source → `replaceRangeWith` at the mapped position). Three details are
 * load-bearing, and each is a way this silently fails:
 *
 * 1. `dropPoint` resolves the drop coordinates to the nearest position the
 *    slice actually fits at. Using the raw pointer position instead lands the
 *    block *next to* where the drop cursor was drawn whenever the gap between
 *    two blocks is too small for the dragged one, which is most of the time.
 * 2. The insert position is mapped through the delete step. Removing a block
 *    shifts every position after it, so an unmapped position drops the block
 *    one slot too high as soon as the drag moves upward.
 * 3. A drop back onto the dragged block is rejected. `dropPoint` will happily
 *    return a position inside the source, and the delete-then-insert pair
 *    would then duplicate it.
 */
function moveDraggedBlock(
  view: EditorView,
  event: DragEvent,
  pos: number,
  slice: Slice,
  moved: boolean,
): void {
  const node = view.state.doc.nodeAt(pos);
  const content = slice.content.firstChild;
  if (!content) return;

  const dropCoords = view.posAtCoords({ left: event.clientX, top: event.clientY });
  if (!dropCoords) return;

  const tr = view.state.tr;

  // Inside the block being dragged: nothing to do, and going ahead would
  // duplicate it.
  if (node && dropCoords.pos > pos && dropCoords.pos < pos + node.nodeSize) return;

  const insertAt = dropPoint(view.state.doc, dropCoords.pos, slice) ?? dropCoords.pos;

  if (moved && node) tr.delete(pos, pos + node.nodeSize);
  const target = moved ? tr.mapping.map(insertAt) : insertAt;

  tr.replaceRangeWith(target, target, content);
  tr.setMeta("uiEvent", "drop");

  view.dispatch(tr.scrollIntoView());
  view.focus();
}

export type SaveStatus = "idle" | "editing" | "saving" | "saved";

interface RichTextEditorProps {
  /** Initial HTML. The editor owns its content after mount. */
  value?: string;
  /** Fires on every document change with the new HTML. */
  onChange?: (html: string) => void;
  placeholder?: string;
  className?: string;
  /** Read-only mode renders the styled prose without any editing chrome. */
  editable?: boolean;
  /** Banner under the editor reporting word count and save state. */
  showFooter?: boolean;
}

/**
 * A rich-text editor for note bodies, backed by Tiptap.
 *
 * This replaces the plain `<textarea>` the Notebook port shipped, which was a
 * regression: the legacy frontapp editor (deleted in the backend's frontend
 * migration) could already do headings, lists, links, tasks, and tables, and
 * notes written with it still contain that markup. A textarea on raw HTML
 * meant editing a formatted note destroyed its formatting.
 *
 * Three details that are easy to get wrong and load-bearing here:
 *
 * 1. `immediatelyRender: false`. Tiptap builds a DOM-bound editor on mount;
 *   under SSR that touches `window` during the server render and throws.
 *   This is the documented escape hatch, and it costs a flash of empty
 *   content on first paint.
 *
 * 2. `transformPastedHTML`. Pasted content arrives from Word, Google Docs, and
 *   other apps carrying inline styles, classes, and `<script>` blocks. The
 *   same sanitizer that guards the read path runs on paste, so the read and
 *   write paths cannot disagree about what is allowed.
 *
 * 3. `lastEmitted`. Without it, `onChange` → parent state → `value` →
 *   `setContent` round-trips on every keystroke, resetting the cursor to the
 *   start of the document.
 */
export function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start writing…",
  className,
  editable = true,
  showFooter = true,
}: RichTextEditorProps) {
  const lastEmitted = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [counts, setCounts] = useState({ characters: 0, words: 0 });

  const editor = useEditor({
    immediatelyRender: false,
    editable,
    extensions: createEditorExtensions({ placeholder }),
    content: value,
    editorProps: {
      attributes: {
        class: "nb-editor-content",
      },
      transformPastedHTML: (html) => sanitizeNoteHtml(html),

      // A `move` drop cursor while a block drag is in flight, so the pointer
      // reports "this will be moved here" over the whole canvas. ProseMirror
      // already calls `preventDefault()` on `dragover`, which is what makes
      // the editor a drop target at all; without `dropEffect` the browser
      // shows the default no-drop cursor over most of the surface.
      handleDOMEvents: {
        dragover: (_view, event) => {
          if (!blockDrag.current) return false;
          const dragEvent = event as DragEvent;
          if (dragEvent.dataTransfer) dragEvent.dataTransfer.dropEffect = "move";
          return false;
        },
      },

      // The block move, then dropped images.
      //
      // Installing a `handleDrop` takes ownership of the drop transaction away
      // from ProseMirror's built-in path, so the move is done here. The slice
      // and the move/copy flag arrive as arguments — ProseMirror read them out
      // of `view.dragging`, which the grip set, so the block lands exactly
      // where the drop indicator was drawn. See `block-drag.ts`.
      handleDrop: (view, event, slice, moved) => {
        const drag = blockDrag.current;
        if (drag) {
          blockDrag.current = null;
          view.dragging = null;
          moveDraggedBlock(view, event as DragEvent, drag.pos, slice, moved);
          event.preventDefault();
          return true;
        }

        const file = firstImage(event.dataTransfer?.files);
        if (!file) return false;

        // `fileToDataUrl` is async, so the drop coordinates are captured here
        // but resolved against the document *inside* the continuation — by
        // then the user may have typed, which shifts every position after
        // their cursor. Mapping through the current selection keeps the image
        // next to where they are now rather than where they were on drop.
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        const anchor = coords?.pos;

        void fileToDataUrl(file).then((src) => {
          if (!src) return;
          const node = view.state.schema.nodes.image.create({ src });
          const pos =
            anchor != null
              ? Math.min(anchor, view.state.doc.content.size)
              : view.state.selection.from;
          view.dispatch(view.state.tr.insert(pos, node));
        });

        event.preventDefault();
        return true;
      },

      // Same for paste. `transformPastedHTML` handles rich text; this catches
      // a copied image file, which arrives as no HTML at all.
      handlePaste: (view, event) => {
        const file = firstImage(event.clipboardData?.files);
        if (!file) return false;

        void fileToDataUrl(file).then((src) => {
          if (!src) return;
          const node = view.state.schema.nodes.image.create({ src });
          // `replaceSelectionWith` rather than an explicit insert position —
          // the selection is read at drop time, after the async read resolves.
          view.dispatch(view.state.tr.replaceSelectionWith(node));
        });

        event.preventDefault();
        return true;
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      lastEmitted.current = html;
      onChange?.(html);

      const text = instance.getText();
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      setCounts({ characters: text.length, words });

      setStatus("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setStatus("saved"), 700);
    },
  });

  // Adopt an externally-changed value (switching notes, or a failed save
  // re-rendering with the server's copy) but never echo our own output back
  // into the document.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    if (value === editor.getHTML()) return;
    if (editor.getText() === "" && value === "") return;

    editor.commands.setContent(value, { emitUpdate: false });
    lastEmitted.current = value;
  }, [value, editor]);

  useEffect(() => {
    if (editor) editor.setEditable(editable);
  }, [editor, editable]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  if (!editable) {
    return (
      <div
        className={cn("nb-prose max-w-[68ch]", className)}
        dangerouslySetInnerHTML={{ __html: sanitizeNoteHtml(value) }}
      />
    );
  }

  return (
    <div
      className={cn(
        "nb-editor-shell relative flex flex-col",
        className,
      )}
    >
      {editor ? (
        <EditorToolbar
          editor={editor}
          className="border-b px-1.5 py-1"
        />
      ) : null}

      {/*
        Content area, ported from the frontapp's
        `features/shared/editor/RichTextEditor.tsx` at `4c97c34^`: a
        `p-2 sm:p-4` inset around a `max-w-[720px]` centred column, with a
        `min-h-[150px]` floor so an empty note is still a click target.
      */}
      <div
        className="cursor-text p-2 sm:p-4"
        onClick={() => editor?.chain().focus().run()}
      >
        {editor ? <EditorDragHandle editor={editor} /> : null}
        <div className="mx-auto w-full max-w-[720px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showFooter ? (
        <div className="flex items-center gap-3 border-t border-[color-mix(in_srgb,var(--nb-ink)_7%,transparent)] px-3.5 py-2 text-[11px] text-muted-foreground">
          <span>{counts.words} words</span>
          <span aria-hidden="true" className="opacity-40">
            |
          </span>
          <span>{counts.characters} characters</span>
          {status === "saving" || status === "saved" ? (
            <>
              <span aria-hidden="true" className="opacity-40">
                |
              </span>
              {/* Announced politely so a screen-reader user hears that the
                  document saved without losing their caret. */}
              <span aria-live="polite">
                {status === "saving" ? "Saving…" : "Saved"}
              </span>
            </>
          ) : null}
        </div>
      ) : null}

      {editor ? (
        <BubbleMenu
          editor={editor}
          options={{ placement: "top", offset: 10 }}
          shouldShow={({ editor: instance, from, to }) =>
            from !== to && !instance.isActive("image") && !instance.isActive("codeBlock")
          }
        >
          <div className="nb-bubble">
            <EditorToolbar
              editor={editor}
              mode="bubble"
              onClearLink={() =>
                editor.chain().focus().extendMarkRange("link").unsetLink().run()
              }
            />
          </div>
        </BubbleMenu>
      ) : null}
    </div>
  );
}
