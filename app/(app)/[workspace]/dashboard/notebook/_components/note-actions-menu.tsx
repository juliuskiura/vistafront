"use client";

import { useState } from "react";

import { Archive, MoreHorizontal, Star, Trash2, Wrench } from "@/lib/icons";
import { cn } from "@/lib/utils";

/**
 * The one action menu a note offers, wherever the note is shown.
 *
 * Star, archive, and delete are the same three things on a card and on the
 * detail page, so they are the same three things in one menu. The card uses the
 * compact trigger because it sits in a dense grid; the detail header uses the
 * labelled one because it is the only control that page offers and it stays in
 * view for the whole read. A bare `⋯` on a page with nothing else in the
 * corner is not discoverable — a named menu is.
 *
 * Dismissal is a full-bleed transparent sheet behind the menu rather than a
 * `keydown` listener, so it closes on a click anywhere — including on the
 * backdrop — without leaving the menu stranded open.
 */
export function QuickToolsMenu({
  archived,
  favorite,
  disabled,
  onStar,
  onArchive,
  onDelete,
  compact,
  className,
}: {
  archived: boolean;
  favorite: boolean;
  disabled: boolean;
  onStar: () => void;
  onArchive: () => void;
  onDelete: () => void;
  /** Icon-only trigger for a card; a labelled button for the detail header. */
  compact?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    // The note card is a Link, so a click anywhere in this menu would also
    // navigate away unless the event is stopped here.
    <div className={cn("relative", className)} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        aria-label={compact ? "Quick tools" : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className={
          compact
            ? "rounded-md p-1.5 text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            : "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2 text-xs font-medium transition-colors hover:bg-accent hover:text-accent-foreground disabled:opacity-50 sm:px-3"
        }
      >
        {compact ? <MoreHorizontal size={15} /> : <Wrench size={14} />}
        {/*
          Icon only on a phone, where the note header's control cluster cannot
          afford the word. The label remains the accessible name either way, so
          the button is never unlabelled.
        */}
        {compact ? null : (
          <>
            <span className="hidden sm:inline">Quick Tools</span>
            <span className="sr-only sm:hidden">Quick tools</span>
          </>
        )}
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
          >
            <MenuItem
              icon={<Star size={13} fill={favorite ? "currentColor" : "none"} />}
              onSelect={() => {
                setOpen(false);
                onStar();
              }}
            >
              {favorite ? "Remove star" : "Star note"}
            </MenuItem>
            <MenuItem
              icon={<Archive size={13} />}
              onSelect={() => {
                setOpen(false);
                onArchive();
              }}
            >
              {archived ? "Restore note" : "Archive note"}
            </MenuItem>
            <MenuItem
              icon={<Trash2 size={13} />}
              destructive
              onSelect={() => {
                setOpen(false);
                onDelete();
              }}
            >
              Delete note
            </MenuItem>
          </div>
        </>
      ) : null}
    </div>
  );
}

function MenuItem({
  icon,
  children,
  onSelect,
  destructive,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <span className={destructive ? undefined : "text-muted-foreground"}>
        {icon}
      </span>
      {children}
    </button>
  );
}
