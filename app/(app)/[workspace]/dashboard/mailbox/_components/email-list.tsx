import Link from "next/link";

import { formatMediumDate } from "@/lib/dates";
import { Inbox, Paperclip, Reply, Star } from "@/lib/icons";
import { EmailRowActions } from "./email-row-actions";
import type { Email, Folder } from "@/lib/api/mailbox";

interface EmailListProps {
  emails: Email[];
  folders: Folder[];
  mailbox: string;
  workspace: string;
  /** Canonical folder name from the URL slug, e.g. "Inbox". */
  folderName: string;
}

function initialsOf(name?: string | null, email?: string | null): string {
  const source = (name || email || "?").trim();
  const words = source.split(/[\s@._-]+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * The message list.
 *
 * Server-rendered: only the per-row action menu is a Client Component, so the
 * list ships with the HTML and needs no client JavaScript to read.
 */
export function EmailList({
  emails,
  folders,
  mailbox,
  workspace,
  folderName,
}: EmailListProps) {
  const base = `/${workspace}/dashboard/mailbox/${mailbox}/${folderName.toLowerCase()}`;

  if (emails.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-20 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
          <Inbox className="h-6 w-6 text-muted-foreground" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Nothing in {folderName}
          </p>
          <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
            Messages sent to this mailbox will appear here as they arrive.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 divide-y divide-border/70 overflow-y-auto">
      {emails.map((email) => {
        const stamp = email.received_at ?? email.sent_at ?? email.created_at;
        const sender = email.sender?.name || email.sender?.email || "Unknown";

        return (
          <div
            key={email.nanoid}
            className={`group relative flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
              email.is_read ? "" : "bg-primary/[0.04]"
            }`}
          >
            {/* Unread marker — a rail rather than a dot, so it reads at a glance */}
            <span
              aria-hidden
              className={`absolute inset-y-0 left-0 w-0.5 transition-colors ${
                email.is_read ? "bg-transparent" : "bg-primary"
              }`}
            />

            <span
              aria-hidden
              className={`mt-0.5 flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full text-[11px] font-semibold ${
                email.is_read
                  ? "bg-muted text-muted-foreground"
                  : "bg-primary/10 text-primary"
              }`}
            >
              {initialsOf(email.sender?.name, email.sender?.email)}
            </span>

            <EmailRowActions
              nanoid={email.nanoid}
              folders={folders}
              currentFolder={folderName}
              workspace={workspace}
              isStarred={Boolean(email.is_starred)}
            />

            <Link href={`${base}/${email.nanoid}`} className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                {email.is_starred && (
                  <Star
                    className="h-3.5 w-3.5 shrink-0 self-center fill-amber-400 text-amber-400"
                    aria-label="Starred"
                  />
                )}
                <span
                  className={`truncate text-sm ${
                    email.is_read
                      ? "text-foreground/80"
                      : "font-semibold text-foreground"
                  }`}
                >
                  {sender}
                </span>
                {!email.is_read && (
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <span className="ml-auto shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {formatMediumDate(stamp)}
                </span>
              </div>

              <p
                className={`mt-0.5 truncate text-sm ${
                  email.is_read
                    ? "text-foreground/70"
                    : "font-medium text-foreground"
                }`}
              >
                {email.subject || "(no subject)"}
              </p>

              {email.body_text && (
                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {email.body_text.replace(/\s+/g, " ").slice(0, 160)}
                </p>
              )}
            </Link>

            <span className="flex shrink-0 items-center gap-1.5 pt-1 text-muted-foreground">
              {Boolean(email.attachment_count) && (
                <Paperclip className="h-3.5 w-3.5" aria-label="Has attachment" />
              )}
              {Boolean(email.reply_count) && (
                <span
                  className="flex items-center gap-0.5 text-[11px] tabular-nums"
                  aria-label={`${email.reply_count} repl${email.reply_count === 1 ? "y" : "ies"}`}
                >
                  <Reply className="h-3 w-3" aria-hidden />
                  {email.reply_count}
                </span>
              )}
            </span>
          </div>
        );
      })}
    </div>
  );
}
