import Link from "next/link";
import { notFound } from "next/navigation";

import { requireWorkspace } from "@/lib/auth/server";
import { listEmails, listFolders, listMailboxes } from "@/lib/api/mailbox";
import { EmailList } from "../../_components/email-list";

/**
 * Message list for one folder of one mailbox.
 *
 * The folder arrives as a URL slug (`inbox`, `sent`, …). We resolve it against
 * the mailbox's real folder names so the backend's `folder__name__iexact`
 * filter gets the canonical casing rather than the slug.
 */
export default async function MailboxFolderPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string; mailbox: string; folder: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspace: slug, mailbox, folder: folderSlug } = await params;
  const query = await searchParams;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const mailboxes = await listMailboxes(ws);
  const box = mailboxes.find((m) => m.nanoid === mailbox);
  if (!box) notFound();

  const folders = await listFolders(mailbox, ws);
  const folder = folders.find((f) => f.name.toLowerCase() === folderSlug.toLowerCase());
  if (!folder) notFound();

  const asFlag = (v: string | string[] | undefined) =>
    v === "true" || v === "1" ? true : undefined;

  const emails = await listEmails({
    mailboxId: mailbox,
    folder: folder.name,
    search: typeof query.q === "string" ? query.q : undefined,
    starred: asFlag(query.starred),
    unread: asFlag(query.unread),
    workspace: ws,
  });

  const unread = emails.filter((e) => !e.is_read).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {folder.name}
          </h2>
          <p className="text-xs text-slate-500">
            {emails.length} message{emails.length === 1 ? "" : "s"}
            {unread > 0 && ` · ${unread} unread`}
          </p>
        </div>

        <form className="ml-auto" action={`/${ws}/dashboard/mailbox/${mailbox}/${folderSlug}`}>
          <input
            type="search"
            name="q"
            defaultValue={typeof query.q === "string" ? query.q : ""}
            placeholder="Search subject or sender"
            className="w-56 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900"
          />
        </form>

        <div className="flex items-center gap-1">
          {[
            { key: "", label: "All" },
            { key: "unread", label: "Unread" },
            { key: "starred", label: "Starred" },
          ].map((f) => {
            const params = new URLSearchParams();
            if (f.key) params.set(f.key, "true");
            if (typeof query.q === "string") params.set("q", query.q);
            const qs = params.toString();
            return (
              <Link
                key={f.key}
                href={`/${ws}/dashboard/mailbox/${mailbox}/${folderSlug}${qs ? `?${qs}` : ""}`}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  (query[f.key] === "true" && f.key) || (!f.key && !query.unread && !query.starred)
                    ? "bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {f.label}
              </Link>
            );
          })}
        </div>
      </div>

      <EmailList
        emails={emails}
        folders={folders}
        mailbox={mailbox}
        workspace={ws}
        folderName={folder.name}
      />
    </>
  );
}
