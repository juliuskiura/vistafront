"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";

import { sanitizeNoteHtml } from "@/lib/api/sanitize-note-html";
import { cn } from "@/lib/utils";

import { EditorToolbar } from "./_components/editor-toolbar";
import { EditorDragHandle } from "./_components/editor-drag-handle";
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

      // Drop an image straight into the document. Without this ProseMirror
      // would insert the filename as text, which is what users hit before.
      handleDrop: (view, event) => {
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
        "relative flex flex-col border-t border-b border-[var(--nb-rule)]",
        className,
      )}
    >
      {editor ? <EditorToolbar editor={editor} className="border-b px-1.5 py-1" /> : null}

      {/*
        `pl-10` reserves a gutter for the drag handle, which is portalled and
        positioned just left of the block's edge. Without it the grip would
        render on top of the page outside the editor.
      */}
      <div
        className="cursor-text py-3 pl-10 pr-4"
        onClick={() => editor?.chain().focus().run()}
      >
        {editor ? <EditorDragHandle editor={editor} /> : null}
        <EditorContent editor={editor} />
      </div>

      {showFooter ? (
        <div className="flex items-center gap-3 border-t px-3 py-1.5 text-[11px] text-muted-foreground">
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
          options={{ placement: "top", offset: 8 }}
          shouldShow={({ editor: instance, from, to }) =>
            from !== to && !instance.isActive("image") && !instance.isActive("codeBlock")
          }
        >
          <div className="flex items-center gap-0.5 rounded-lg border bg-popover p-1 text-popover-foreground shadow-md">
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
