"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableHeader } from "@tiptap/extension-table-header";
import { TableCell } from "@tiptap/extension-table-cell";

import { EditorToolbar } from "./email-editor-toolbar";
import styles from "./email-editor.module.css";

interface EmailEditorProps {
  initialHTML?: string;
  /**
   * Called on every keystroke with both projections. `text` is TipTap's own
   * plain-text output — deriving it by stripping tags would mangle inline
   * elements and decode entities wrongly.
   */
  onChange?: (html: string, text: string) => void;
  /** Called once when the editor mounts, so the form can hide its textarea. */
  onReady?: () => void;
  placeholder?: string;
}

interface DraftField {
  open: boolean;
  value: string;
}

const CLOSED: DraftField = { open: false, value: "" };

/**
 * Rich-text composer body.
 *
 * Ported from the deleted SPA's `features/mailbox/components/EmailEditor.tsx`
 * (commit 4c97c34^), which used the same extension set and the same toolbar.
 * The notebook feature shipped a plain textarea instead and documented it as
 * "the port's known gap"; this closes that gap.
 *
 * Three deliberate changes from the original:
 *
 *  - The original called `window.prompt` for link and image URLs. Native
 *    prompt dialogs cannot be styled, are blocked in some embedded contexts,
 *    and look out of place next to the rest of the UI. Both use a small inline
 *    field in the toolbar instead.
 *  - Styling is a scoped CSS module rather than the `prose-*` classes from
 *    `@tailwindcss/typography`, which is not a dependency here.
 *  - Links get `rel="noopener noreferrer nofollow"`, since a composer can put
 *    a hostile URL in an email that a recipient will click.
 */
export function EmailEditor({
  initialHTML = "",
  onChange,
  onReady,
  placeholder = "Write your message…",
}: EmailEditorProps) {
  const [linkDraft, setLinkDraft] = useState<DraftField>(CLOSED);
  const [imageDraft, setImageDraft] = useState<DraftField>(CLOSED);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      Image,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHTML,
    // TipTap builds a DOM-bound editor on mount. Under SSR that touches
    // `window` during the server render and throws, so Next.js needs the
    // documented escape hatch. The cost is a brief empty frame on first paint,
    // which the skeleton in the early return below covers.
    immediatelyRender: false,
    editorProps: {
      attributes: { class: styles.editor },
      // Pasted content arrives from Word, Google Docs and other editors carrying
      // inline styles, classes and — in the worst case — `<script>` blocks. TipTap
      // parses pasted HTML into the document, so it has to be stripped here, at
      // the point of entry, or a user can smuggle markup into a sent email by
      // pasting rather than typing. TipTap's schema already drops unknown nodes;
      // this additionally clears the attributes it preserves.
      transformPastedHTML: (html: string) =>
        html
          // Strip script/style blocks with their contents.
          .replace(/<script[\s\S]*?<\/script>/gi, "")
          .replace(/<style[\s\S]*?<\/style>/gi, "")
          // Drop event handlers and javascript: URLs.
          .replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
          .replace(/(href|src)\s*=\s*(?:"javascript:[^"]*"|'javascript:[^']*')/gi, "")
          // Remove inline style/class attributes; class names would leak our
          // own scoped CSS into the recipient's mail client.
          .replace(/\s(?:style|class)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, ""),
    },
    onUpdate: ({ editor: e }) => onChange?.(e.getHTML(), e.getText()),
  });

  useEffect(() => {
    if (editor) onReady?.();
  }, [editor, onReady]);

  // Seed the document once, and only while it is still empty, so we never
  // clobber what the user has typed.
  useEffect(() => {
    if (editor && initialHTML && editor.isEmpty) {
      editor.commands.setContent(initialHTML);
    }
    // Intentionally editor-guard only: re-running on every `initialHTML` change
    // would overwrite typing once the prop settles.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  const closeDrafts = useCallback(() => {
    setLinkDraft(CLOSED);
    setImageDraft(CLOSED);
  }, []);

  /** Bare domains are the common case, so normalise rather than reject them. */
  const toHref = useCallback((value: string) => {
    const trimmed = value.trim();
    if (/^(https?:|mailto:|tel:|\/)/i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }, []);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const value = linkDraft.value.trim();
    if (!value) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: toHref(value) }).run();
    closeDrafts();
  }, [editor, linkDraft.value, toHref, closeDrafts]);

  const applyImage = useCallback(() => {
    const value = imageDraft.value.trim();
    if (editor && value) {
      editor.chain().focus().setImage({ src: toHref(value) }).run();
    }
    closeDrafts();
  }, [editor, imageDraft.value, toHref, closeDrafts]);

  /** Address toolbar commands by name so the toolbar needs no TipTap import. */
  const runCommand = useCallback(
    (name: string) => {
      if (!editor) return;
      const chain = () => editor.chain().focus();
      switch (name) {
        case "bold": chain().toggleBold().run(); break;
        case "italic": chain().toggleItalic().run(); break;
        case "underline": chain().toggleUnderline().run(); break;
        case "strike": chain().toggleStrike().run(); break;
        case "bulletList": chain().toggleBulletList().run(); break;
        case "orderedList": chain().toggleOrderedList().run(); break;
        case "alignLeft": chain().setTextAlign("left").run(); break;
        case "alignCenter": chain().setTextAlign("center").run(); break;
        case "alignRight": chain().setTextAlign("right").run(); break;
        case "table":
          chain()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run();
          break;
      }
    },
    [editor],
  );

  if (!editor) {
    // Matches the textarea's footprint so the form does not jump on mount.
    return (
      <div className="min-h-[340px] w-full animate-pulse rounded-xl bg-muted/40" />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
      <EditorToolbar
        isActive={(name, attrs) => editor.isActive(name, attrs)}
        onCommand={runCommand}
        onToggleLinkField={() => {
          setImageDraft(CLOSED);
          setLinkDraft((d) => ({
            open: !d.open,
            value: d.open
              ? ""
              : ((editor.getAttributes("link").href as string) ?? ""),
          }));
        }}
        onToggleImageField={() => {
          setLinkDraft(CLOSED);
          setImageDraft((d) => ({ open: !d.open, value: "" }));
        }}
      />

      {linkDraft.open && (
        <DraftField
          label="Link URL"
          placeholder="https://example.com — leave empty to remove the link"
          value={linkDraft.value}
          onChange={(value) => setLinkDraft({ open: true, value })}
          onApply={applyLink}
          onCancel={closeDrafts}
        />
      )}

      {imageDraft.open && (
        <DraftField
          label="Image URL"
          placeholder="https://example.com/image.png"
          value={imageDraft.value}
          onChange={(value) => setImageDraft({ open: true, value })}
          onApply={applyImage}
          onCancel={closeDrafts}
        />
      )}

      <EditorContent editor={editor} />
    </div>
  );
}

function DraftField({
  label,
  placeholder,
  value,
  onChange,
  onApply,
  onCancel,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-2.5 py-2">
      <input
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onApply();
          }
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        aria-label={label}
        className="flex-1 rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
      />
      <button
        type="button"
        onClick={onApply}
        className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Apply
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted"
      >
        Cancel
      </button>
    </div>
  );
}
