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
        <div className="mt-6 flex h-[clamp(560px,74vh,900px)] flex-1 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {/* A DEFINITE height, not `min-h`. The compose body and the message
              list rely on `flex-1 + overflow-y-auto` to scroll internally,
              which only works when the flex container is height-bounded. With
              `min-h-[72vh]` the content simply grew past the box and this
              container's `overflow-hidden` clipped the bottom — which is
              exactly where the attachment tray lives. `clamp` keeps the height
              sensible on both short and tall viewports. */}
          <MailboxRail
            mailboxes={mailboxes}
            foldersByMailbox={foldersByMailbox}
            workspace={ws}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-card">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
