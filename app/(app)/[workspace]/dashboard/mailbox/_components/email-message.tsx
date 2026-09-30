"use client";

import { useState } from "react";

import Link from "next/link";
import { Paperclip, Reply, Send, Star } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { EmailBodyFrame } from "./email-body-frame";
import { RemoteImageToggle } from "./remote-image-toggle";
import { EmailDetailActions } from "./email-detail-actions";
import type { Attachment, Email } from "@/lib/api/mailbox";

interface EmailMessageProps {
  email: Email;
  attachments: Attachment[];
  folders: { nanoid: string; name: string }[];
  mailbox: string;
  folder: string;
  workspace: string;
}

/**
 * A single message.
 *
 * Server Component would normally render this, but the body needs a live
 * "show images" toggle, which is genuine client state. The message metadata and
 * action bar still come from the server as props — nothing is re-fetched here.
 */
export function EmailMessage({
  email,
  attachments,
  folders,
  mailbox,
  folder,
  workspace,
}: EmailMessageProps) {
  const [blockRemote, setBlockRemote] = useState(true);
  const stamp = email.received_at ?? email.sent_at ?? email.created_at;
  const hasHtml = Boolean(email.body_html);

  return (
    <>
      <div className="flex flex-wrap items-start gap-2 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {email.subject || "(no subject)"}
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {email.sender?.name || email.sender?.email}
            </span>
            {email.sender?.name && email.sender?.email && (
              <span className="ml-1">&lt;{email.sender.email}&gt;</span>
            )}
            <span className="ml-2">to {email.recipient_count ?? 0} recipient(s)</span>
            <span className="ml-2">{formatMediumDate(stamp)}</span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {email.is_starred && (
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
          )}
          <EmailDetailActions
            nanoid={email.nanoid}
            folders={folders}
            currentFolder={folder}
            mailbox={mailbox}
            workspace={workspace}
            isDraft={Boolean(email.is_draft)}
          />
        </div>
      </div>

      {hasRemoteImages(email.body_html ?? "") && (
        <RemoteImageToggle blocked={blockRemote} onChange={setBlockRemote} />
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-4 py-2 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500">
            {attachments.length} attachment{attachments.length === 1 ? "" : "s"}
          </span>
          {attachments.map((att) => (
            <a
              key={att.nanoid}
              href={att.url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Paperclip className="h-3 w-3" />
              <span className="max-w-[180px] truncate">{att.filename}</span>
              <span className="text-slate-400">{formatSize(att.size)}</span>
            </a>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {hasHtml ? (
          <EmailBodyFrame
            html={email.body_html ?? ""}
            attachments={attachments}
            blockRemoteImages={blockRemote}
          />
        ) : (
          <pre className="whitespace-pre-wrap break-words font-sans text-sm text-slate-800 dark:text-slate-200">
            {email.body_text || "(no message body)"}
          </pre>
        )}
      </div>

      {email.replies && email.replies.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <p className="mb-2 text-xs font-semibold text-slate-500">
            {email.replies.length} repl{email.replies.length === 1 ? "y" : "ies"}
          </p>
          <ul className="space-y-1">
            {email.replies.map((reply) => (
              <li key={reply.nanoid} className="truncate text-xs text-slate-600 dark:text-slate-400">
                <Reply className="mr-1 inline h-3 w-3" />
                {reply.sender?.name || reply.sender?.email} — {reply.subject}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
        <Link
          href={`/${workspace}/dashboard/mailbox/${mailbox}/compose?reply_to=${email.nanoid}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <Reply className="h-3.5 w-3.5" />
          Reply
        </Link>
        {email.is_draft && (
          <Link
            href={`/${workspace}/dashboard/mailbox/${mailbox}/compose?draft=${email.nanoid}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-500"
          >
            <Send className="h-3.5 w-3.5" />
            Continue draft
          </Link>
        )}
      </div>
    </>
  );
}

/** Cheap check so the privacy banner only appears when it can do something. */
function hasRemoteImages(html: string): boolean {
  return /<img[^>]+src="https?:\/\//i.test(html);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
