"use client";

import type { Editor } from "@tiptap/react";

import {
  Bold,
  Code,
  Eraser,
  Italic,
  Link2,
  List,
  ListChecks,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Table,
  Underline,
  Undo2,
} from "@/lib/icons";

import { HighlightColorButton, TextColorButton } from "./editor-color-picker";
import { HeadingSelect } from "./editor-heading-select";
import {
  ToolbarButton,
  ToolbarDivider,
  ToolbarGroup,
} from "./editor-toolbar-primitives";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
  onClearLink?: () => void;
  className?: string;
}

/**
 * The formatting toolbar.
 *
 * Two rendering modes from one button list: `mode="bubble"` drops the block
 * controls (headings, lists, tables) because a floating menu over a text
 * selection should offer marks, not structure. Sharing the definitions means
 * a button added here appears in both without a second edit.
 *
 * The heading and colour controls are dropdowns rather than buttons, so the
 * bar fits on one row: six heading levels plus two palettes is eight controls
 * that would otherwise be a second toolbar row.
 */
export function EditorToolbar({
  editor,
  onClearLink,
  className,
  mode = "bar",
}: EditorToolbarProps & { mode?: "bar" | "bubble" }) {
  if (!editor) return null;

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  return (
    <div
      role="toolbar"
      aria-label="Text formatting"
      className={cn("flex flex-wrap items-center gap-0.5", className)}
    >
      {mode === "bar" ? (
        <>
          <ToolbarGroup>
            <HeadingSelect editor={editor} />
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              label="Bold"
            >
              <Bold size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              label="Italic"
            >
              <Italic size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              label="Underline"
            >
              <Underline size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              label="Strikethrough"
            >
              <Strikethrough size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              label="Inline code"
            >
              <Code size={15} />
            </ToolbarButton>
            <TextColorButton editor={editor} />
            <HighlightColorButton editor={editor} />
          </ToolbarGroup>

          <ToolbarDivider />
        </>
      ) : null}

      <ToolbarGroup>
        <ToolbarButton
          onClick={setLink}
          active={editor.isActive("link")}
          label="Link"
        >
          <Link2 size={15} />
        </ToolbarButton>
        {editor.isActive("link") && onClearLink ? (
          <ToolbarButton onClick={onClearLink} label="Remove link">
            <Eraser size={15} />
          </ToolbarButton>
        ) : null}
        {mode === "bubble" ? <TextColorButton editor={editor} /> : null}
        {mode === "bubble" ? <HighlightColorButton editor={editor} /> : null}
        {mode === "bubble" ? (
          // "Clear formatting" is the escape hatch a floating bar owes you:
          // without it, a run that picked up four marks while you were
          // nudging the colour swatch has no single control that undoes it.
          <ToolbarButton
            onClick={() =>
              editor
                .chain()
                .focus()
                .extendMarkRange("bold")
                .unsetAllMarks()
                .run()
            }
            label="Clear formatting"
          >
            <Eraser size={15} />
          </ToolbarButton>
        ) : null}
      </ToolbarGroup>

      {mode === "bar" ? (
        <>
          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              label="Bulleted list"
            >
              <List size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              label="Numbered list"
            >
              <ListOrdered size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive("taskList")}
              label="Task list"
            >
              <ListChecks size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              label="Quote"
            >
              <Quote size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              active={editor.isActive("table")}
              label="Insert table"
            >
              <Table size={15} />
            </ToolbarButton>
          </ToolbarGroup>

          <ToolbarDivider />

          <ToolbarGroup>
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              label="Undo"
              disabled={!editor.can().undo()}
            >
              <Undo2 size={15} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              label="Redo"
              disabled={!editor.can().redo()}
            >
              <Redo2 size={15} />
            </ToolbarButton>
          </ToolbarGroup>
        </>
      ) : null}
    </div>
  );
}
