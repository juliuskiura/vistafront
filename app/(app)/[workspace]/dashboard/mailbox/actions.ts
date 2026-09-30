"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flattenError } from "zod";

import * as composeApi from "@/lib/api/mailbox-compose";
import { screenFiles } from "@/lib/mailbox/attachment-rules";
import { uploadAttachment } from "@/lib/api/mailbox-attachments";

import {
  MoveEmailSchema,
  ReorderFoldersSchema,
  SaveDraftSchema,
  SendEmailSchema,
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
  const bodyHtml = payload.body_html || textToHtml(payload.body_text);

  // Attachments hang off an already-saved email (`POST /emails/{nanoid}/attachments/`
  // is a detail route), so a message with files must be drafted first, given
  // the files, and only then sent. A message with no files skips the draft
  // entirely and goes straight out in one request.
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);
  const { accepted, rejected } = screenFiles(files);

  if (rejected.length > 0) {
    return {
      status: "error",
      message: `${rejected[0].filename}: ${rejected[0].reason}`,
    };
  }

  try {
    if (accepted.length > 0) {
      const draft = await composeApi.saveDraft(
        {
          mailbox_id: payload.mailbox_id,
          to: payload.to,
          cc: payload.cc,
          bcc: payload.bcc,
          subject: payload.subject,
          body_text: payload.body_text,
          body_html: bodyHtml,
          in_reply_to: payload.in_reply_to || null,
        },
        workspace,
      );

      // Sequential, not Promise.all: each upload is a multipart round-trip and
      // firing them together against one draft is needless pressure on the
      // worker that has to read each file into memory.
      for (const file of accepted) {
        await uploadAttachment(draft.nanoid, file, workspace);
      }

      await composeApi.sendDraftNow(draft.nanoid, workspace);
    } else {
      await composeApi.sendEmail(
        {
          mailbox_id: payload.mailbox_id,
          to: payload.to,
          cc: payload.cc,
          bcc: payload.bcc,
          subject: payload.subject,
          body_text: payload.body_text,
          body_html: bodyHtml,
          in_reply_to: payload.in_reply_to || null,
          signature_included: payload.signature_included,
          scheduled_at: scheduledAt,
        },
        workspace,
      );
    }
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
    await composeApi.saveDraft(
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
  await composeApi.sendDraftNow(nanoid, workspace);
  revalidateMailbox(workspace);
  redirect(`/${workspace}/dashboard/mailbox/${mailboxId}/sent`);
}

export async function resendEmailAction(
  mailboxId: string,
  nanoid: string,
  workspace: string,
): Promise<void> {
  await composeApi.resendEmail(nanoid, workspace);
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
  await composeApi.moveEmail(nanoid, folder, workspace);
  revalidateMailbox(workspace);
}

export async function toggleReadAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await composeApi.toggleRead(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function toggleStarAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await composeApi.toggleStar(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function deleteEmailAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await composeApi.deleteEmail(nanoid, workspace);
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
  await composeApi.reorderFolders(parsed.data.mailbox_id, parsed.data.ordered_ids, workspace);
  revalidateMailbox(workspace);
}
