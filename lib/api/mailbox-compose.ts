"use server";

/**
 * Compose-side mailbox writes: sending, drafts, and per-message actions.
 *
 * Split out of `mailbox.ts` to keep each module inside the 300-line budget.
 * Reads and types stay in `mailbox.ts`; mailbox/domain administration lives in
 * `mailbox-admin.ts`.
 */

import { serverMutate } from "./server-fetch";
import type { Email } from "./mailbox";

const BASE = "/apis/mailbox";

function qs(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, value);
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

export interface SendEmailInput {
  mailbox_id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body_text: string;
  body_html?: string;
  in_reply_to?: string | null;
  signature_included?: boolean;
  scheduled_at?: string | null;
}

export async function sendEmail(
  input: SendEmailInput,
  workspace: string,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/send/`, {
    method: "POST",
    body: input,
    workspace,
  });
}

export interface SaveDraftInput {
  mailbox_id: string;
  email_id?: string | null;
  to?: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  body_text?: string;
  body_html?: string;
  in_reply_to?: string | null;
}

export async function saveDraft(
  input: SaveDraftInput,
  workspace: string,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/drafts/`, {
    method: "POST",
    body: input,
    workspace,
  });
}

export async function sendDraftNow(
  nanoid: string,
  workspace: string,
  signatureIncluded = false,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/${nanoid}/send_now/`, {
    method: "POST",
    body: { signature_included: signatureIncluded },
    workspace,
  });
}

export async function resendEmail(
  nanoid: string,
  workspace: string,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/${nanoid}/resend/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function moveEmail(
  nanoid: string,
  folderNanoid: string,
  workspace: string,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/${nanoid}/move/`, {
    method: "POST",
    body: { folder: folderNanoid },
    workspace,
  });
}

export async function toggleRead(
  nanoid: string,
  workspace: string,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/${nanoid}/toggle_read/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function toggleStar(
  nanoid: string,
  workspace: string,
): Promise<Email> {
  return serverMutate<Email>(`${BASE}/emails/${nanoid}/toggle_star/`, {
    method: "POST",
    body: {},
    workspace,
  });
}

export async function deleteEmail(nanoid: string, workspace: string): Promise<void> {
  await serverMutate<unknown>(`${BASE}/emails/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

export async function reorderFolders(
  mailboxId: string,
  orderedIds: string[],
  workspace: string,
): Promise<{ status: string }> {
  return serverMutate<{ status: string }>(
    `${BASE}/folders/reorder/${qs({ mailbox_id: mailboxId })}`,
    { method: "POST", body: { ordered_ids: orderedIds }, workspace },
  );
}
