"use server";

import { serverFetch, serverMutate } from "./server-fetch";
import type { Paginated } from "./types";

const BASE = "/apis/mailbox";

function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

/* ------------------------------------------------------------------ *
 * Types — mirror the deleted SPA's `apptypes/mailbox.ts`, minus the
 * fields the current backend serializers no longer expose.
 * ------------------------------------------------------------------ */

export interface Attachment {
  id: string;
  nanoid: string;
  filename: string;
  content_type: string;
  size: number;
  url: string | null;
  is_inline: boolean;
  content_id?: string | null;
}

export interface EmailSender {
  name?: string | null;
  email: string;
}

export interface EmailRecipient {
  name?: string | null;
  address: string;
  recipient_type?: string | null;
}

export interface Email {
  id: string;
  nanoid: string;
  message_id?: string | null;
  subject: string;
  sender: EmailSender;
  recipients?: EmailRecipient[];
  recipient_count?: number;
  reply_count?: number;
  in_reply_to_nanoid?: string | null;
  replies?: Email[];
  attachment_count?: number;
  attachments?: Attachment[];
  folder_name?: string | null;
  body_text?: string | null;
  body_html?: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_draft?: boolean;
  /** Numeric label ids — present on the list serializer. */
  label_ids?: number[];
  /** Full label objects — present on the detail serializer. */
  labels?: Label[];
  send_status?: string | null;
  delivery_status?: string | null;
  open_count?: number;
  click_count?: number;
  is_unsubscribed?: boolean;
  sent_at?: string | null;
  received_at?: string | null;
  scheduled_at?: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface Folder {
  id: string;
  nanoid: string;
  name: string;
  is_system: boolean;
  icon: string;
  order?: number | null;
  unread_count: number;
  mailbox_nanoid: string | null;
}

export interface Label {
  id: string;
  nanoid: string;
  name: string;
  slug: string;
  color: string;
}

export interface Mailbox {
  id: string;
  nanoid: string;
  email_address: string;
  domain: string;
  domain_config: string | null;
  display_name: string;
  is_active: boolean;
  order?: number | null;
  labels: Label[];
  email_template?: string | null;
  password_display?: string;
}

export interface DomainConfig {
  id: string;
  nanoid: string;
  domain: string;
  s3_bucket: string;
  aws_access_key_id_display: string;
  aws_secret_access_key_display: string;
  aws_ses_region_name: string;
  provider: string;
  mailbox_count: number;
  workspace?: string | null;
}

export interface Signature {
  id: string;
  nanoid: string;
  mailbox: string;
  is_enabled: boolean;
  display_name: string;
  company: string;
  theme_color: string;
  custom_html: string;
  signature_html?: string;
}

export interface SignatureInput {
  mailbox: string;
  is_enabled?: boolean;
  display_name?: string;
  title?: string;
  company?: string;
  company_tagline?: string;
  phone?: string;
  website_url?: string;
  email_address?: string;
  address?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  registration_number?: string;
  vat_number?: string;
  registered_office?: string;
  theme_color?: string;
  logo_url?: string;
  logo_width?: number;
}

export async function createSignature(
  input: SignatureInput,
  workspace: string,
): Promise<Signature> {
  return serverMutate<Signature>(`${BASE}/signatures/`, {
    method: "POST",
    body: input,
    workspace,
  });
}

export async function updateSignature(
  nanoid: string,
  input: Partial<SignatureInput>,
  workspace: string,
): Promise<Signature> {
  return serverMutate<Signature>(`${BASE}/signatures/${nanoid}/`, {
    method: "PATCH",
    body: input,
    workspace,
  });
}

/* ------------------------------------------------------------------ *
 * Query-string builders
 *
 * The deleted SPA's `getFolders` built `/folders/?mailbox_id=x` by
 * concatenating a leading slash onto a `?…` string, which put the slash
 * between the resource and the query string. We build params properly.
 * ------------------------------------------------------------------ */

function qs(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : "";
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

export async function listMailboxes(workspace: string): Promise<Mailbox[]> {
  return serverFetch<Mailbox[] | Paginated<Mailbox>>(`${BASE}/mailboxes/`, {
    workspace,
  }).then(unwrap);
}

export async function getMailbox(
  nanoid: string,
  workspace: string,
): Promise<Mailbox> {
  return serverFetch<Mailbox>(`${BASE}/mailboxes/${nanoid}/`, { workspace });
}

export async function listFolders(
  mailboxId: string,
  workspace: string,
): Promise<Folder[]> {
  return serverFetch<Folder[] | Paginated<Folder>>(
    `${BASE}/folders/${qs({ mailbox_id: mailboxId })}`,
    { workspace },
  ).then(unwrap);
}

export interface ListEmailsArgs {
  mailboxId: string;
  folder?: string;
  search?: string;
  starred?: boolean;
  unread?: boolean;
  workspace: string;
}

export async function listEmails({
  mailboxId,
  folder,
  search,
  starred,
  unread,
  workspace,
}: ListEmailsArgs): Promise<Email[]> {
  const path = `${BASE}/emails/${qs({
    mailbox_id: mailboxId,
    folder,
    search,
    starred: starred ? "true" : undefined,
    unread: unread ? "true" : undefined,
  })}`;
  return serverFetch<Email[] | Paginated<Email>>(path, { workspace }).then(unwrap);
}

export async function getEmail(
  nanoid: string,
  workspace: string,
  mailboxId?: string,
): Promise<Email> {
  return serverFetch<Email>(`${BASE}/emails/${nanoid}/${qs({ mailbox_id: mailboxId })}`, {
    workspace,
  });
}

export async function listSignatures(
  mailboxId: string,
  workspace: string,
): Promise<Signature[]> {
  return serverFetch<Signature[] | Paginated<Signature>>(
    `${BASE}/signatures/${qs({ mailbox_id: mailboxId })}`,
    { workspace },
  ).then(unwrap);
}

export async function listLabels(
  mailboxId: string,
  workspace: string,
): Promise<Label[]> {
  return serverFetch<Label[] | Paginated<Label>>(
    `${BASE}/labels/${qs({ mailbox_id: mailboxId })}`,
    { workspace },
  ).then(unwrap);
}

export async function listDomainConfigs(workspace: string): Promise<DomainConfig[]> {
  return serverFetch<DomainConfig[] | Paginated<DomainConfig>>(
    `${BASE}/domain-configs/`,
    { workspace },
  ).then(unwrap);
}

export async function getDomainConfig(
  nanoid: string,
  workspace: string,
): Promise<DomainConfig> {
  return serverFetch<DomainConfig>(`${BASE}/domain-configs/${nanoid}/`, {
    workspace,
  });
}

/* ------------------------------------------------------------------ *
 * Writes
 * ------------------------------------------------------------------ */

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

export interface MailboxInput {
  email_address: string;
  domain: string;
  domain_config: string | null;
  display_name: string;
  password?: string;
  confirm_password?: string;
  email_template?: "none" | "premium";
}

export async function createMailbox(
  input: MailboxInput,
  workspace: string,
): Promise<Mailbox> {
  return serverMutate<Mailbox>(`${BASE}/mailboxes/`, {
    method: "POST",
    body: input,
    workspace,
  });
}

export async function updateMailbox(
  nanoid: string,
  input: Partial<MailboxInput>,
  workspace: string,
): Promise<Mailbox> {
  return serverMutate<Mailbox>(`${BASE}/mailboxes/${nanoid}/`, {
    method: "PATCH",
    body: input,
    workspace,
  });
}

export async function deleteMailbox(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<unknown>(`${BASE}/mailboxes/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

export async function reorderMailboxes(
  orderedIds: string[],
  workspace: string,
): Promise<{ status: string }> {
  return serverMutate<{ status: string }>(`${BASE}/mailboxes/reorder/`, {
    method: "POST",
    body: { ordered_ids: orderedIds },
    workspace,
  });
}

export interface DomainConfigInput {
  domain: string;
  s3_bucket: string;
  aws_access_key_id: string;
  aws_secret_access_key: string;
  aws_ses_region_name: string;
  provider: string;
}

export async function createDomainConfig(
  input: DomainConfigInput,
  workspace: string,
): Promise<DomainConfig> {
  return serverMutate<DomainConfig>(`${BASE}/domain-configs/`, {
    method: "POST",
    body: input,
    workspace,
  });
}

export async function updateDomainConfig(
  nanoid: string,
  input: Partial<DomainConfigInput>,
  workspace: string,
): Promise<DomainConfig> {
  return serverMutate<DomainConfig>(`${BASE}/domain-configs/${nanoid}/`, {
    method: "PATCH",
    body: input,
    workspace,
  });
}

export async function deleteDomainConfig(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<unknown>(`${BASE}/domain-configs/${nanoid}/`, {
    method: "DELETE",
    body: {},
    workspace,
  });
}

export async function testS3Connection(
  nanoid: string,
  workspace: string,
): Promise<{ status: string; message: string }> {
  return serverMutate<{ status: string; message: string }>(
    `${BASE}/domain-configs/${nanoid}/test_s3_connection/`,
    { method: "POST", body: {}, workspace },
  );
}

export async function syncMails(
  nanoid: string,
  workspace: string,
): Promise<{ status: string; processed: number; skipped: number; errors: number }> {
  return serverMutate<{
    status: string;
    processed: number;
    skipped: number;
    errors: number;
  }>(`${BASE}/domain-configs/${nanoid}/sync_mails/`, {
    method: "POST",
    body: {},
    workspace,
  });
}
