"use client";

import type { Editor } from "@tiptap/react";

import {
  Bold,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
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
          <Group>
            <MarkButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive("bold")}
              label="Bold"
            >
              <Bold size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive("italic")}
              label="Italic"
            >
              <Italic size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              active={editor.isActive("underline")}
              label="Underline"
            >
              <Underline size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              active={editor.isActive("strike")}
              label="Strikethrough"
            >
              <Strikethrough size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              active={editor.isActive("code")}
              label="Inline code"
            >
              <Code size={15} />
            </MarkButton>
          </Group>

          <Divider />

          <Group>
            <MarkButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              active={editor.isActive("heading", { level: 1 })}
              label="Heading 1"
            >
              <Heading1 size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive("heading", { level: 2 })}
              label="Heading 2"
            >
              <Heading2 size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive("heading", { level: 3 })}
              label="Heading 3"
            >
              <Heading3 size={15} />
            </MarkButton>
          </Group>

          <Divider />
        </>
      ) : null}

      <Group>
        <MarkButton
          onClick={setLink}
          active={editor.isActive("link")}
          label="Link"
        >
          <Link2 size={15} />
        </MarkButton>
        {editor.isActive("link") && onClearLink ? (
          <MarkButton
            onClick={onClearLink}
            active={false}
            label="Remove link"
          >
            <Eraser size={15} />
          </MarkButton>
        ) : null}
      </Group>

      {mode === "bar" ? (
        <>
          <Divider />

          <Group>
            <MarkButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive("bulletList")}
              label="Bulleted list"
            >
              <List size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              active={editor.isActive("orderedList")}
              label="Numbered list"
            >
              <ListOrdered size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleTaskList().run()}
              active={editor.isActive("taskList")}
              label="Task list"
            >
              <ListChecks size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive("blockquote")}
              label="Quote"
            >
              <Quote size={15} />
            </MarkButton>
            <MarkButton
              onClick={() =>
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }
              active={editor.isActive("table")}
              label="Insert table"
            >
              <Table size={15} />
            </MarkButton>
          </Group>

          <Divider />

          <Group>
            <MarkButton
              onClick={() => editor.chain().focus().undo().run()}
              active={false}
              label="Undo"
              disabled={!editor.can().undo()}
            >
              <Undo2 size={15} />
            </MarkButton>
            <MarkButton
              onClick={() => editor.chain().focus().redo().run()}
              active={false}
              label="Redo"
              disabled={!editor.can().redo()}
            >
              <Redo2 size={15} />
            </MarkButton>
          </Group>
        </>
      ) : null}
    </div>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      className="mx-1 h-4 w-px shrink-0 bg-border"
    />
  );
}

interface MarkButtonProps {
  onClick: () => void;
  active: boolean;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}

/**
 * `aria-pressed` rather than a visual-only active state, so a screen reader
 * announces which formats are currently applied to the selection.
 */
function MarkButton({
  onClick,
  active,
  label,
  disabled,
  children,
}: MarkButtonProps) {
  return (
    <button
      type="button"
      // Keep focus in the editor: a toolbar that steals focus would collapse
      // the selection the command is about to act on.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded transition-colors disabled:opacity-30",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
