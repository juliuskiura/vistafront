"use client";

import { cn } from "@/lib/utils";

/** A run of related buttons with no visual chrome of its own. */
export function ToolbarGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-0.5">{children}</div>;
}

/** A hairline between groups, so a long toolbar stays scannable. */
export function ToolbarDivider() {
  return <span aria-hidden="true" className="mx-1 h-4 w-px shrink-0 bg-border" />;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * The base toolbar button.
 *
 * `onMouseDown` is prevented so the editor keeps focus and, critically, so the
 * selection a command is about to act on survives the click. Without it the
 * browser moves focus to the button on mousedown, the editor selection
 * collapses, and `toggleBold()` applies to a collapsed cursor — the single
 * most common "my formatting does nothing" bug in a Tiptap toolbar.
 *
 * `aria-pressed` rather than a visual-only active state, so a screen reader
 * announces which formats are currently applied to the selection.
 */
export function ToolbarButton({
  onClick,
  active = false,
  label,
  disabled,
  children,
  className,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "inline-flex size-7 shrink-0 items-center justify-center rounded transition-colors disabled:opacity-30",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      {children}
    </button>
  );
}
