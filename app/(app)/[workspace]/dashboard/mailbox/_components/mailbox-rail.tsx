"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import {
  ChevronLeft,
  ChevronRight,
  Mail,
  Settings as SettingsIcon,
} from "@/lib/icons";
import { MailboxSection } from "./mailbox-section";
import type { Folder, Mailbox } from "@/lib/api/mailbox";

const STORAGE_KEY = "mailbox:rail-collapsed";
/** Same-tab notification, since `storage` only fires in *other* tabs. */
const TOGGLE_EVENT = "mailbox:rail-toggle";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // Private mode or blocked storage: treat as expanded.
    return false;
  }
}

function serverCollapsed(): boolean {
  // Must match the server-rendered markup, then sync on the client.
  return false;
}

function subscribeCollapsed(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(TOGGLE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(TOGGLE_EVENT, onChange);
  };
}

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

  // The stored preference is external state, so it is read through
  // useSyncExternalStore rather than seeded with useState + useEffect. The
  // server snapshot is `false`, so the first client render matches the
  // server-rendered markup and React syncs afterwards — no hydration mismatch.
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    serverCollapsed,
  );

  function toggleCollapsed() {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    } catch {
      // Ignore: persistence is a nicety, not a requirement.
    }
    window.dispatchEvent(new Event(TOGGLE_EVENT));
  }

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

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={`shrink-0 border-r border-slate-200 bg-slate-50/60 transition-all dark:border-slate-800 dark:bg-slate-900/40 ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-slate-200 p-2 dark:border-slate-800">
          <Mail className="h-4 w-4 shrink-0 text-primary-600" />
          {!collapsed && (
            <span className="flex-1 truncate text-sm font-bold">Mailbox</span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="mailbox-rail-nav"
            title={
              collapsed
                ? "Expand mailbox sidebar"
                : "Collapse mailbox sidebar"
            }
            className="shrink-0 rounded-md p-1 text-slate-500 transition-colors hover:bg-slate-200/70 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        <div className="p-2">
          <Link
            href={`${base}/${activeMailbox ?? mailboxes[0].nanoid}/compose`}
            title="Compose"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary-500"
          >
            <Mail className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Compose</span>}
          </Link>
        </div>

        <nav
          id="mailbox-rail-nav"
          aria-label="Mailboxes and folders"
          className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 pb-2"
        >
          {mailboxes.map((mailbox) => (
            <MailboxSection
              key={mailbox.nanoid}
              mailbox={mailbox}
              folders={foldersByMailbox[mailbox.nanoid] ?? []}
              base={base}
              activeMailbox={activeMailbox}
              activeFolder={activeFolder}
              collapsed={collapsed}
              workspace={workspace}
            />
          ))}

          <Link
            href={`${base}/settings`}
            title="Settings"
            className="mt-3 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <SettingsIcon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
