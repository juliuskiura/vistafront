"use client";

import Link from "next/link";
import { useState, useTransition, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

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

interface MailboxRailProps {
  mailboxes: Mailbox[];
  foldersByMailbox: Record<string, Folder[]>;
  workspace: string;
}

/**
 * Left-hand folder rail.
 *
 * The deleted SPA fetched folders per mailbox through a shared RTK Query tag,
 * so one mailbox's folders were served to every mailbox section — the bug the
 * team documented in `MailboxRoutes.tsx`. Here the folders arrive as a prop
 * keyed by mailbox nanoid, so each section renders only its own list and the
 * failure mode cannot recur.
 */
export function MailboxRail({
  mailboxes,
  foldersByMailbox,
  workspace,
}: MailboxRailProps) {
  const base = `/${workspace}/dashboard/mailbox`;
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  // Derive the active mailbox/folder from the URL rather than from props, so
  // the rail highlights correctly on every nested route without the server
  // having to thread router state down through the layout.
  const activeMatch = useMemo(
    () => pathname.match(/\/mailbox\/([^/]+)(?:\/([^/]+))?/),
    [pathname],
  );
  const activeMailbox = activeMatch?.[1] ?? null;
  const activeFolder = activeMatch?.[2] ?? null;

  if (mailboxes.length === 0) {
    return (
      <aside className="w-64 shrink-0 border-r border-slate-200 p-4 dark:border-slate-800">
        <p className="text-sm font-semibold">Mailboxes</p>
        <p className="mt-2 text-xs text-slate-500">No mailboxes yet.</p>
        <Link
          href={`${base}/settings`}
          className="mt-3 inline-block text-xs font-medium text-primary-600 hover:underline"
        >
          Create one
        </Link>
      </aside>
    );
  }

  function onDrop(mailboxId: string, folders: Folder[], index: number) {
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
      void reorderFoldersAction(mailboxId, ordered, workspace).then(() =>
        router.refresh(),
      );
    });
  }

  return (
    <aside
      className={`shrink-0 border-r border-slate-200 bg-slate-50/60 transition-all dark:border-slate-800 dark:bg-slate-900/40 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <Mail className="h-4 w-4 shrink-0 text-primary-600" />
          {!collapsed && (
            <span className="truncate text-sm font-bold">Mailbox</span>
          )}
        </div>

        <div className="p-2">
          <Link
            href={`${base}/${activeMailbox ?? mailboxes[0].nanoid}/compose`}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-500"
          >
            <Mail className="h-4 w-4" />
            {!collapsed && <span>Compose</span>}
          </Link>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 pb-2">
          {mailboxes.map((mailbox) => {
            const folders = foldersByMailbox[mailbox.nanoid] ?? [];
            const isOpen = open[mailbox.nanoid] ?? true;
            return (
              <div key={mailbox.nanoid}>
                <button
                  type="button"
                  onClick={() =>
                    setOpen((prev) => ({
                      ...prev,
                      [mailbox.nanoid]: !isOpen,
                    }))
                  }
                  title={collapsed ? mailbox.email_address : undefined}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <ChevronDown
                    className={`h-3 w-3 shrink-0 transition-transform ${isOpen ? "" : "-rotate-90"}`}
                  />
                  <Mail className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="truncate">{mailbox.email_address}</span>
                  )}
                </button>

                {isOpen && !collapsed && (
                  <div className="ml-4 mt-0.5 space-y-0.5">
                    {folders.map((folder, index) => {
                      const Icon = ICONS[folder.icon] ?? FileText;
                      const slug = folder.name.toLowerCase();
                      const active =
                        activeMailbox === mailbox.nanoid &&
                        activeFolder?.toLowerCase() === slug;
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
                              onDrop(mailbox.nanoid, folders, index);
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
                              href={`${base}/${mailbox.nanoid}/${slug}`}
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
          })}

          <Link
            href={`${base}/settings`}
            className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <FileText className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="border-t border-slate-200 py-1.5 text-center text-xs text-slate-500 hover:bg-slate-200/70 dark:border-slate-800 dark:hover:bg-slate-800"
        >
          {collapsed ? "»" : "«"}
        </button>
      </div>
    </aside>
  );
}
