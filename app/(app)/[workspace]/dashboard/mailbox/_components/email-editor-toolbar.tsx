"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Strikethrough,
  Table as TableIcon,
  Underline as UnderlineIcon,
} from "@/lib/icons";

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      // mousedown would blur the editor and drop the selection before the
      // command reads it, so prevent the default focus shift.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border" />;
}

export interface EditorToolbarProps {
  /** Live `isActive` predicate, read from the TipTap editor. */
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean;
  onCommand: (name: string) => void;
  onToggleLinkField: () => void;
  onToggleImageField: () => void;
}

/**
 * The formatting toolbar.
 *
 * Split out of `email-editor.tsx` to keep both files inside the 300-line
 * budget. Commands are addressed by name so this component stays free of any
 * direct TipTap dependency — the editor owns the instance.
 */
export function EditorToolbar({
  isActive,
  onCommand,
  onToggleLinkField,
  onToggleImageField,
}: EditorToolbarProps) {
  return (
    <div
      className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/30 px-2 py-1.5"
      role="toolbar"
      aria-label="Text formatting"
    >
      <ToolbarButton
        title="Bold"
        active={isActive("bold")}
        onClick={() => onCommand("bold")}
      >
        <Bold className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        title="Italic"
        active={isActive("italic")}
        onClick={() => onCommand("italic")}
      >
        <Italic className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        title="Underline"
        active={isActive("underline")}
        onClick={() => onCommand("underline")}
      >
        <UnderlineIcon className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        title="Strikethrough"
        active={isActive("strike")}
        onClick={() => onCommand("strike")}
      >
        <Strikethrough className="h-4 w-4" aria-hidden />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Bullet list"
        active={isActive("bulletList")}
        onClick={() => onCommand("bulletList")}
      >
        <List className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        title="Numbered list"
        active={isActive("orderedList")}
        onClick={() => onCommand("orderedList")}
      >
        <ListOrdered className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton title="Insert table" onClick={() => onCommand("table")}>
        <TableIcon className="h-4 w-4" aria-hidden />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Align left"
        active={isActive("textAlign", { textAlign: "left" })}
        onClick={() => onCommand("alignLeft")}
      >
        <AlignLeft className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        title="Align centre"
        active={isActive("textAlign", { textAlign: "center" })}
        onClick={() => onCommand("alignCenter")}
      >
        <AlignCenter className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        title="Align right"
        active={isActive("textAlign", { textAlign: "right" })}
        onClick={() => onCommand("alignRight")}
      >
        <AlignRight className="h-4 w-4" aria-hidden />
      </ToolbarButton>

      <Divider />

      <ToolbarButton
        title="Insert link"
        active={isActive("link")}
        onClick={onToggleLinkField}
      >
        <LinkIcon className="h-4 w-4" aria-hidden />
      </ToolbarButton>
      <ToolbarButton title="Insert image" onClick={onToggleImageField}>
        <ImageIcon className="h-4 w-4" aria-hidden />
      </ToolbarButton>
    </div>
  );
}
