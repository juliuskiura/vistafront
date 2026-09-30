import { notFound, redirect } from "next/navigation";

import { requireWorkspace } from "@/lib/auth/server";
import { getEmail, listMailboxes, listSignatures } from "@/lib/api/mailbox";
import { ComposeForm } from "../../_components/compose-form";

export default async function ComposePage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string; mailbox: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspace: slug, mailbox } = await params;
  const query = await searchParams;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const mailboxes = await listMailboxes(ws);
  if (!mailboxes.some((m) => m.nanoid === mailbox)) {
    redirect(`/${ws}/dashboard/mailbox/${mailboxes[0]?.nanoid ?? ""}/compose`);
  }
  if (mailboxes.length === 0) notFound();

  const draftId = typeof query.draft === "string" ? query.draft : undefined;
  const replyTo = typeof query.reply_to === "string" ? query.reply_to : undefined;

  let initialTo = "";
  let initialSubject = "";
  let initialBody = "";

  if (draftId || replyTo) {
    const source = await getEmail(draftId ?? replyTo ?? "", ws, mailbox).catch(
      () => null,
    );
    if (source) {
      if (replyTo) {
        // Reply: prefill the sender, quote nothing, and mark the subject.
        initialTo = source.sender?.email ?? "";
        initialSubject = source.subject?.startsWith("Re:")
          ? source.subject
          : `Re: ${source.subject ?? ""}`.trim();
      } else {
        initialTo = (source.recipients ?? [])
          .filter((r) => r.recipient_type !== "bcc")
          .map((r) => r.address)
          .join(", ");
        initialSubject = source.subject ?? "";
        initialBody = source.body_text ?? "";
      }
    }
  }

  // The signature is appended by the backend at send time, so it never
  // pre-occupies the body where the salutation goes. We only surface it so the
  // operator can see what will be attached.
  const signatures = await listSignatures(mailbox, ws).catch(() => []);

  return (
    <>
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-2.5 dark:border-slate-800">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          New message
        </h2>
        {signatures[0]?.signature_html && (
          <span className="text-xs text-slate-500">
            Your signature will be appended automatically.
          </span>
        )}
      </div>

      <ComposeForm
        workspace={ws}
        mailboxes={mailboxes.map((m) => ({
          nanoid: m.nanoid,
          email_address: m.email_address,
        }))}
        defaultMailbox={mailbox}
        replyTo={replyTo}
        draftId={draftId}
        initialTo={initialTo}
        initialSubject={initialSubject}
        initialBody={initialBody}
      />
    </>
  );
}
