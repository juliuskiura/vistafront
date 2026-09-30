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
  const [, startTransition] = useTransition();
  const router = useRouter();

  // A collapsed rail has no room for a disclosure triangle, so the active
  // mailbox's folders show as a flat icon column. Hiding them entirely would
  // leave a collapsed rail that cannot navigate anywhere.
  const showFolders = collapsed ? activeMailbox === mailbox.nanoid : open;

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
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        {!collapsed && (
          <ChevronDown
            className={`h-3 w-3 shrink-0 transition-transform ${
              open ? "" : "-rotate-90"
            }`}
          />
        )}
        <Mail className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{mailbox.email_address}</span>}
      </button>

      {showFolders && (
        <div className={collapsed ? "mt-0.5 space-y-0.5" : "ml-4 mt-0.5 space-y-0.5"}>
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
                  className={`flex items-center justify-center rounded-lg py-1.5 transition-colors ${
                    active
                      ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                      : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                </Link>
              );
            }

            return (
              <div key={folder.nanoid}>
                {dropIndex === index && (
                  <div className="mx-2 h-0.5 rounded bg-primary-500" />
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
                    dragId === folder.nanoid ? "opacity-50" : undefined
                  }
                >
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                      active
                        ? "bg-primary-50 font-medium text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{folder.name}</span>
                    {folder.unread_count > 0 && (
                      <span className="rounded bg-primary-100 px-1.5 py-0.5 text-[11px] font-semibold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
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
    </div>
  );
}
