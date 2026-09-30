"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flattenError } from "zod";

import * as api from "@/lib/api/mailbox";

import {
  DomainConfigSchema,
  MailboxCreateSchema,
  MailboxUpdateSchema,
  MoveEmailSchema,
  ReorderFoldersSchema,
  SaveDraftSchema,
  SendEmailSchema,
  SignatureSchema,
} from "./schemas";

import type { MailboxActionState } from "./action-state";

/** Revalidate the whole mailbox section so folder counts and lists refresh. */
function revalidateMailbox(workspace: string) {
  revalidatePath(`/${workspace}/dashboard/mailbox`, "layout");
}

function fail(error: unknown, fallback: string): MailboxActionState {
  console.error("[mailbox] action failed:", error);
  return { status: "error", message: fallback };
}

/**
 * Escape a plain-text body into minimal HTML for the compose editor.
 *
 * The backend sanitizes inbound HTML, but an outgoing body built here is
 * attacker-adjacent too (a user could paste markup into the textarea). Escaping
 * first means we only ever emit tags we created ourselves.
 */
function textToHtml(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("");
}

/* ------------------------------------------------------------------ *
 * Composing
 * ------------------------------------------------------------------ */

export async function sendEmailAction(
  _prev: MailboxActionState,
  formData: FormData,
): Promise<MailboxActionState> {
  const parsed = SendEmailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }

  const { workspace, ...payload } = parsed.data;
  const scheduledAt = payload.scheduled_at?.trim() || null;

  try {
    await api.sendEmail(
      {
        mailbox_id: payload.mailbox_id,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        subject: payload.subject,
        body_text: payload.body_text,
        body_html: payload.body_html || textToHtml(payload.body_text),
        in_reply_to: payload.in_reply_to || null,
        signature_included: payload.signature_included,
        scheduled_at: scheduledAt,
      },
      workspace,
    );
  } catch (error) {
    return fail(error, "The message could not be sent. Check the recipients and try again.");
  }

  revalidateMailbox(workspace);
  redirect(`/${workspace}/dashboard/mailbox/${payload.mailbox_id}/sent`);
}

export async function saveDraftAction(
  _prev: MailboxActionState,
  formData: FormData,
): Promise<MailboxActionState> {
  const parsed = SaveDraftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }

  const { workspace, ...payload } = parsed.data;
  try {
    await api.saveDraft(
      {
        mailbox_id: payload.mailbox_id,
        email_id: payload.email_id || null,
        to: payload.to,
        cc: payload.cc,
        bcc: payload.bcc,
        subject: payload.subject,
        body_text: payload.body_text,
        body_html: payload.body_html || textToHtml(payload.body_text),
        in_reply_to: payload.in_reply_to || null,
      },
      workspace,
    );
  } catch (error) {
    return fail(error, "The draft could not be saved. Try again.");
  }

  revalidateMailbox(workspace);
  return { status: "success", message: "Draft saved." };
}

export async function sendDraftNowAction(
  mailboxId: string,
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.sendDraftNow(nanoid, workspace);
  revalidateMailbox(workspace);
  redirect(`/${workspace}/dashboard/mailbox/${mailboxId}/sent`);
}

export async function resendEmailAction(
  mailboxId: string,
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.resendEmail(nanoid, workspace);
  revalidateMailbox(workspace);
  redirect(`/${workspace}/dashboard/mailbox/${mailboxId}/queued`);
}

/* ------------------------------------------------------------------ *
 * Single-email mutations (button-click actions, no FormData)
 * ------------------------------------------------------------------ */

export async function moveEmailAction(
  nanoid: string,
  folder: string,
  workspace: string,
): Promise<void> {
  const parsed = MoveEmailSchema.safeParse({ workspace, nanoid, folder });
  if (!parsed.success) return;
  await api.moveEmail(nanoid, folder, workspace);
  revalidateMailbox(workspace);
}

export async function toggleReadAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.toggleRead(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function toggleStarAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.toggleStar(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function deleteEmailAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.deleteEmail(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function reorderFoldersAction(
  mailboxId: string,
  orderedIds: string[],
  workspace: string,
): Promise<void> {
  const parsed = ReorderFoldersSchema.safeParse({
    workspace,
    mailbox_id: mailboxId,
    ordered_ids: orderedIds,
  });
  if (!parsed.success) return;
  await api.reorderFolders(parsed.data.mailbox_id, parsed.data.ordered_ids, workspace);
  revalidateMailbox(workspace);
}

/* ------------------------------------------------------------------ *
 * Mailbox + domain-config CRUD
 * ------------------------------------------------------------------ */

export async function createMailboxAction(
  _prev: MailboxActionState,
  formData: FormData,
): Promise<MailboxActionState> {
  const parsed = MailboxCreateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }

  const { workspace, ...payload } = parsed.data;
  try {
    await api.createMailbox(
      {
        email_address: payload.email_address,
        domain: payload.domain,
        domain_config: payload.domain_config || null,
        display_name: payload.display_name,
        password: payload.password,
        confirm_password: payload.confirm_password,
        email_template: payload.email_template,
      },
      workspace,
    );
  } catch (error) {
    return fail(error, "The mailbox could not be created. The address may already exist.");
  }

  revalidateMailbox(workspace);
  return { status: "success", message: `Mailbox ${payload.email_address} created.` };
}

export async function updateMailboxAction(
  _prev: MailboxActionState,
  formData: FormData,
): Promise<MailboxActionState> {
  const parsed = MailboxUpdateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }

  const { workspace, nanoid, ...payload } = parsed.data;
  try {
    await api.updateMailbox(
      nanoid,
      {
        display_name: payload.display_name,
        email_template: payload.email_template,
        ...(payload.password
          ? { password: payload.password, confirm_password: payload.confirm_password }
          : {}),
      },
      workspace,
    );
  } catch (error) {
    return fail(error, "The mailbox could not be updated.");
  }

  revalidateMailbox(workspace);
  return { status: "success", message: "Mailbox updated." };
}

export async function deleteMailboxAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.deleteMailbox(nanoid, workspace);
  revalidateMailbox(workspace);
  redirect(`/${workspace}/dashboard/mailbox/settings`);
}

export async function createDomainConfigAction(
  _prev: MailboxActionState,
  formData: FormData,
): Promise<MailboxActionState> {
  const parsed = DomainConfigSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }

  const { workspace, ...payload } = parsed.data;
  try {
    await api.createDomainConfig(payload, workspace);
  } catch (error) {
    return fail(error, "The domain configuration could not be saved.");
  }

  revalidateMailbox(workspace);
  return { status: "success", message: `Domain ${payload.domain} configured.` };
}

export async function deleteDomainConfigAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await api.deleteDomainConfig(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function testS3ConnectionAction(
  nanoid: string,
  workspace: string,
): Promise<MailboxActionState> {
  try {
    const result = await api.testS3Connection(nanoid, workspace);
    return {
      status: result.status === "ok" ? "success" : "error",
      message: result.message,
    };
  } catch (error) {
    return fail(error, "The S3 connection test could not be completed.");
  }
}

export async function syncMailsAction(
  nanoid: string,
  workspace: string,
): Promise<MailboxActionState> {
  try {
    const result = await api.syncMails(nanoid, workspace);
    revalidateMailbox(workspace);
    return {
      status: "success",
      message: `Sync finished — ${result.processed} processed, ${result.skipped} skipped, ${result.errors} error(s).`,
    };
  } catch (error) {
    return fail(error, "The mail sync could not be completed.");
  }
}

/* ------------------------------------------------------------------ *
 * Signature
 * ------------------------------------------------------------------ */

export async function saveSignatureAction(
  _prev: MailboxActionState,
  formData: FormData,
): Promise<MailboxActionState> {
  const parsed = SignatureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return { status: "error", fieldErrors };
  }

  const { workspace, ...payload } = parsed.data;
  const existing = await api.listSignatures(payload.mailbox, workspace);

  try {
    if (existing.length > 0) {
      await api.updateSignature(existing[0].nanoid, payload, workspace);
    } else {
      await api.createSignature(payload, workspace);
    }
  } catch (error) {
    return fail(error, "The signature could not be saved.");
  }

  revalidateMailbox(workspace);
  return { status: "success", message: "Signature saved." };
}
