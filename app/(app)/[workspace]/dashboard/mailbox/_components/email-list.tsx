import Link from "next/link";
import { formatMediumDate } from "@/lib/dates";
import { Paperclip, Star } from "@/lib/icons";
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

/**
 * Server-rendered message list.
 *
 * Only the per-row action menu is a Client Component; the rows themselves are
 * plain markup so the list ships with the HTML and needs no client JS to read.
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
      <div className="flex flex-1 flex-col items-center justify-center py-16 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
          <Paperclip className="h-5 w-5 text-slate-400" />
        </div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
          No messages in {folderName}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Messages sent to this mailbox will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 divide-y divide-slate-200 overflow-y-auto dark:divide-slate-800">
      {emails.map((email) => {
        const stamp = email.received_at ?? email.sent_at ?? email.created_at;
        const senderName =
          email.sender?.name || email.sender?.email || "Unknown sender";

        return (
          <div
            key={email.nanoid}
            className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
              email.is_read ? "" : "bg-primary-50/40 dark:bg-primary-950/20"
            }`}
          >
            <EmailRowActions
              nanoid={email.nanoid}
              folders={folders}
              currentFolder={folderName}
              workspace={workspace}
              isStarred={email.is_starred}
            />

            <Link href={`${base}/${email.nanoid}`} className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                {email.is_starred && (
                  <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                )}
                <span
                  className={`truncate text-sm ${
                    email.is_read
                      ? "text-slate-600 dark:text-slate-400"
                      : "font-semibold text-slate-900 dark:text-slate-100"
                  }`}
                >
                  {senderName}
                </span>
                <span className="ml-auto shrink-0 text-xs text-slate-400">
                  {formatMediumDate(stamp)}
                </span>
              </div>
              <p
                className={`mt-0.5 truncate text-sm ${
                  email.is_read
                    ? "text-slate-600 dark:text-slate-400"
                    : "font-medium text-slate-900 dark:text-slate-100"
                }`}
              >
                {email.subject || "(no subject)"}
              </p>
              {email.body_text && (
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {email.body_text.slice(0, 140)}
                </p>
              )}
            </Link>

            <span className="flex shrink-0 items-center gap-1 pt-0.5">
              {Boolean(email.attachment_count) && (
                <Paperclip className="h-3.5 w-3.5 text-slate-400" />
              )}
              {Boolean(email.reply_count) && (
                <span className="text-[11px] text-slate-400">
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
