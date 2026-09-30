import Link from "next/link";
import { notFound } from "next/navigation";

import { requireWorkspace } from "@/lib/auth/server";
import { getEmail, listFolders, listMailboxes } from "@/lib/api/mailbox";
import { EmailMessage } from "../../../_components/email-message";

export default async function EmailDetailPage({
  params,
}: {
  params: Promise<{
    workspace: string;
    mailbox: string;
    folder: string;
    id: string;
  }>;
}) {
  const { workspace: slug, mailbox, folder: folderSlug, id } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const mailboxes = await listMailboxes(ws);
  if (!mailboxes.some((m) => m.nanoid === mailbox)) notFound();

  const folders = await listFolders(mailbox, ws);
  const folder = folders.find((f) => f.name.toLowerCase() === folderSlug.toLowerCase());
  if (!folder) notFound();

  // Scoped by mailbox nanoid as well as email nanoid, so a message from one
  // mailbox can never be rendered inside another's URL.
  const email = await getEmail(id, ws, mailbox).catch(() => null);
  if (!email) notFound();

  return (
    <>
      <div className="border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <Link
          href={`/${ws}/dashboard/mailbox/${mailbox}/${folderSlug}`}
          className="text-xs font-medium text-primary-600 hover:underline dark:text-primary-400"
        >
          ← Back to {folder.name}
        </Link>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <EmailMessage
          email={email}
          attachments={email.attachments ?? []}
          folders={folders.map((f) => ({ nanoid: f.nanoid, name: f.name }))}
          mailbox={mailbox}
          folder={folder.name}
          workspace={ws}
        />
      </div>
    </>
  );
}
