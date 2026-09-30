import { redirect } from "next/navigation";

import { requireWorkspace } from "@/lib/auth/server";
import { listFolders, listMailboxes } from "@/lib/api/mailbox";

/**
 * Mailbox entry point. Sends the operator to the first mailbox's inbox, or to
 * settings when no mailbox exists yet — the behaviour the deleted SPA's
 * `MailboxIndexRedirect` provided.
 */
export default async function MailboxIndexPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const mailboxes = await listMailboxes(ws);
  const first = mailboxes[0];

  if (!first) {
    redirect(`/${ws}/dashboard/mailbox/settings`);
  }

  const folders = await listFolders(first.nanoid, ws);
  const inbox =
    folders.find((f) => f.name.toLowerCase() === "inbox") ?? folders[0];

  redirect(
    inbox
      ? `/${ws}/dashboard/mailbox/${first.nanoid}/${inbox.name.toLowerCase()}`
      : `/${ws}/dashboard/mailbox/${first.nanoid}/inbox`,
  );
}
