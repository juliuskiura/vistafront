"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

import { ChevronLeft, ChevronRight, Mail, PenLine, Settings } from "@/lib/icons";
import { MailboxSection } from "./mailbox-section";
import type { Folder, Mailbox } from "@/lib/api/mailbox";

const STORAGE_KEY = "mailbox:rail-collapsed";
/** Same-tab notification, since `storage` only fires in *other* tabs. */
const TOGGLE_EVENT = "mailbox:rail-toggle";

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function serverCollapsed(): boolean {
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
 * The mailbox sidebar: a slim, collapsible rail holding every mailbox and its
 * folders.
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

  // External state, so it is read through useSyncExternalStore rather than
  // seeded with useState + useEffect. The server snapshot is `false`, keeping
  // the first client render identical to the server-rendered markup.
  const collapsed = useSyncExternalStore(
    subscribeCollapsed,
    readCollapsed,
    serverCollapsed,
  );

  function toggleCollapsed() {
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "0" : "1");
    } catch {
      // Persistence is a nicety, not a requirement.
    }
    window.dispatchEvent(new Event(TOGGLE_EVENT));
  }

  const activeMatch = pathname.match(/\/mailbox\/([^/]+)(?:\/([^/]+))?/);
  const activeMailbox = activeMatch?.[1] ?? null;
  const activeFolder = activeMatch?.[2] ?? null;

  if (mailboxes.length === 0) {
    return (
      <aside className="w-64 shrink-0 border-r border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Mailboxes</p>
        <p className="mt-1.5 text-xs text-muted-foreground">
          No mailboxes yet.
        </p>
        <Link
          href={`${base}/settings`}
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary underline-offset-4 hover:underline"
        >
          <PenLine className="h-3.5 w-3.5" aria-hidden />
          Create one
        </Link>
      </aside>
    );
  }

  return (
    <aside
      data-collapsed={collapsed ? "true" : "false"}
      className={`shrink-0 overflow-hidden border-r border-border bg-card transition-[width] duration-200 ease-out ${
        collapsed ? "w-14" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Brand row + collapse control.

            Collapsed, the rail is 56px wide with 24px of horizontal padding,
            leaving a 32px content box — exactly one icon. Showing the brand
            chip *and* the toggle together overflows by 32px, and because the
            toggle is the last flex item the aside's `overflow-hidden` clipped
            it away: the control was present in the DOM but neither visible nor
            clickable, which is the worst failure mode for the one control that
            reopens the rail. So collapsed, the toggle takes the row alone. */}
        <div
          className={`flex items-center gap-2 border-b border-border py-3 ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          {!collapsed && (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="h-4 w-4" aria-hidden />
            </span>
          )}
          {!collapsed && (
            <span className="flex-1 truncate text-sm font-semibold tracking-tight text-foreground">
              Mailbox
            </span>
          )}
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="mailbox-rail-nav"
            aria-label={
              collapsed ? "Expand mailbox sidebar" : "Collapse mailbox sidebar"
            }
            title={
              collapsed ? "Expand mailbox sidebar" : "Collapse mailbox sidebar"
            }
            className={`shrink-0 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 ${
              collapsed ? "mx-auto" : "-mr-1 flex items-center gap-1"
            }`}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" aria-hidden />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4" aria-hidden />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Primary action */}
        <div className="p-3">
          <Link
            href={`${base}/${activeMailbox ?? mailboxes[0].nanoid}/compose`}
            title="Compose"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1"
          >
            <PenLine className="h-4 w-4 shrink-0 transition-transform group-hover:-rotate-12" aria-hidden />
            {!collapsed && <span>Compose</span>}
          </Link>
        </div>

        <nav
          id="mailbox-rail-nav"
          aria-label="Mailboxes and folders"
          className="min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-2 pb-3"
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
            className="mt-2 flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4 shrink-0" aria-hidden />
            {!collapsed && <span>Settings</span>}
          </Link>
        </nav>
      </div>
    </aside>
  );
}
