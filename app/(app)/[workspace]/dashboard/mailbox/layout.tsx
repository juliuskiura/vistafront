import { requireWorkspace } from "@/lib/auth/server";
import { listFolders, listMailboxes } from "@/lib/api/mailbox";
import { Banner } from "@/components/banner";
import { MailboxRail } from "./_components/mailbox-rail";

/**
 * Mailbox shell.
 *
 * Mailbox is a console-admin-only feature (see `mailbox/navigation.py`,
 * `console_admin_only = True`). The backend already hides the sidebar link and
 * scopes every read to the requesting user's own mailboxes, so this layout
 * fetches the mailboxes once and hands each mailbox's folders down keyed by
 * nanoid.
 */
export default async function MailboxLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const mailboxes = await listMailboxes(ws);

  // Folders are fetched per mailbox, each scoped by its own nanoid. Fetching
  // them in parallel keeps the rail from serialising one request per mailbox.
  const folderEntries = await Promise.all(
    mailboxes.map(async (mailbox) => {
      try {
        return [mailbox.nanoid, await listFolders(mailbox.nanoid, ws)] as const;
      } catch {
        return [mailbox.nanoid, []] as const;
      }
    }),
  );
  const foldersByMailbox: Record<string, Awaited<ReturnType<typeof listFolders>>> =
    Object.fromEntries(folderEntries);

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Mailbox"
        description="Read, compose and send email from your mailboxes, with per-mailbox folders and delivery tracking."
      />

      {mailboxes.length === 0 ? (
        <div className="mt-6 flex-1">{children}</div>
      ) : (
        <div className="mt-6 flex min-h-[70vh] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          <MailboxRail
            mailboxes={mailboxes}
            foldersByMailbox={foldersByMailbox}
            workspace={ws}
          />
          <div className="flex min-w-0 flex-1 flex-col">{children}</div>
        </div>
      )}
    </div>
  );
}
