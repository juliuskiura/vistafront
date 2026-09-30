"use server";

/**
 * Mailbox and domain administration writes.
 *
 * Split out of `mailbox.ts` to keep each module inside the 300-line budget.
 * These back the Mailbox settings screen rather than the reading experience.
 */

import { serverMutate } from "./server-fetch";
import type {
  DomainConfig,
  Mailbox,
  Signature,
  SignatureInput,
} from "./mailbox";

const BASE = "/apis/mailbox";

/* ------------------------------------------------------------------ *
 * Signatures
 * ------------------------------------------------------------------ */

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
