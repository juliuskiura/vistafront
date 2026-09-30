"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Archive,
  ChevronDown,
  Clock,
  FileText,
  Inbox,
  Mail,
  Send,
  ShieldAlert,
  Trash2,
} from "@/lib/icons";
import { reorderFoldersAction } from "../actions";
import type { Folder, Mailbox } from "@/lib/api/mailbox";

const ICONS: Record<string, typeof Inbox> = {
  inbox: Inbox,
  send: Send,
  file: FileText,
  archive: Archive,
  trash: Trash2,
  spam: ShieldAlert,
  clock: Clock,
};

interface MailboxSectionProps {
  mailbox: Mailbox;
  /** Only this mailbox's folders — never another mailbox's. */
  folders: Folder[];
  base: string;
  activeMailbox: string | null;
  activeFolder: string | null;
  collapsed: boolean;
  workspace: string;
}

/**
 * One mailbox and its folders, including the drag-to-reorder handles.
 *
 * Drag state lives here rather than in the rail because reordering is scoped to
 * a single mailbox's folder list, so two mailboxes can never share a drag
 * session.
 */
export function MailboxSection({
  mailbox,
  folders,
  base,
  activeMailbox,
  activeFolder,
  collapsed,
  workspace,
}: MailboxSectionProps) {
  const [open, setOpen] = useState(true);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [isOpenMailbox, startTransition] = useTransition();
  const router = useRouter();

  // A collapsed rail has no room for a disclosure triangle, so the active
  // mailbox's folders show as a flat icon column. Hiding them entirely would
  // leave a collapsed rail that cannot navigate anywhere.
  const showFolders = collapsed ? activeMailbox === mailbox.nanoid : open;
  const isActive = activeMailbox === mailbox.nanoid;

  function onDrop(index: number) {
    if (!dragId || dragId === folders[index]?.nanoid) return;
    const ordered = folders.map((f) => f.nanoid);
    const from = ordered.indexOf(dragId);
    if (from === -1) return;
    ordered.splice(from, 1);
    const to = index > from ? index - 1 : index;
    ordered.splice(to, 0, dragId);
    setDragId(null);
    setDropIndex(null);
    startTransition(() => {
      void reorderFoldersAction(mailbox.nanoid, ordered, workspace).then(() =>
        router.refresh(),
      );
    });
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={collapsed ? undefined : open}
        onClick={() => {
          if (collapsed) {
            router.push(`${base}/${mailbox.nanoid}/inbox`);
            return;
          }
          setOpen((prev) => !prev);
        }}
        title={mailbox.email_address}
        className={`group flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors ${
          isActive && collapsed
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {!collapsed && (
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-muted-foreground transition-transform duration-200 ${
              open ? "" : "-rotate-90"
            }`}
            aria-hidden
          />
        )}
        <Mail
          className={`h-4 w-4 shrink-0 ${
            isActive ? "text-primary" : "text-muted-foreground"
          }`}
          aria-hidden
        />
        {!collapsed && <span className="truncate">{mailbox.email_address}</span>}
      </button>

      {showFolders && (
        <div
          className={`mt-0.5 space-y-0.5 ${collapsed ? "" : "ml-5 border-l border-border/70 pl-2"}`}
        >
          {folders.map((folder, index) => {
            const Icon = ICONS[folder.icon] ?? FileText;
            const slug = folder.name.toLowerCase();
            const active =
              activeMailbox === mailbox.nanoid &&
              activeFolder?.toLowerCase() === slug;
            const href = `${base}/${mailbox.nanoid}/${slug}`;

            if (collapsed) {
              return (
                <Link
                  key={folder.nanoid}
                  href={href}
                  title={folder.name}
                  aria-label={folder.name}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-center rounded-lg py-2 transition-colors ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                </Link>
              );
            }

            return (
              <div key={folder.nanoid}>
                {dropIndex === index && (
                  <div className="mx-2 my-0.5 h-0.5 rounded-full bg-primary" />
                )}
                <div
                  draggable
                  onDragStart={() => setDragId(folder.nanoid)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropIndex(index);
                  }}
                  onDragLeave={() => setDropIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    onDrop(index);
                  }}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropIndex(null);
                  }}
                  className={
                    dragId === folder.nanoid ? "opacity-40" : undefined
                  }
                >
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors ${
                      active
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? "text-primary" : "text-muted-foreground/80"
                      }`}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{folder.name}</span>
                    {folder.unread_count > 0 && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary"
                        }`}
                      >
                        {folder.unread_count}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isOpenMailbox && <span className="sr-only">Saving folder order…</span>}
    </div>
  );
}
