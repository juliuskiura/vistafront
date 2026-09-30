"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flattenError } from "zod";

import * as api from "@/lib/api/mailbox";
import * as adminApi from "@/lib/api/mailbox-admin";

import {
  DomainConfigSchema,
  MailboxCreateSchema,
  MailboxUpdateSchema,
  SignatureSchema,
} from "./schemas";
import type { MailboxActionState } from "./action-state";

/** Revalidate the whole mailbox section so folder counts and lists refresh. */
function revalidateMailbox(workspace: string) {
  revalidatePath(`/${workspace}/dashboard/mailbox`, "layout");
}

function fail(error: unknown, fallback: string): MailboxActionState {
  console.error("[mailbox] admin action failed:", error);
  return { status: "error", message: fallback };
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
    await adminApi.createMailbox(
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
    await adminApi.updateMailbox(
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
  await adminApi.deleteMailbox(nanoid, workspace);
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
    await adminApi.createDomainConfig(payload, workspace);
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
  await adminApi.deleteDomainConfig(nanoid, workspace);
  revalidateMailbox(workspace);
}

export async function testS3ConnectionAction(
  nanoid: string,
  workspace: string,
): Promise<MailboxActionState> {
  try {
    const result = await adminApi.testS3Connection(nanoid, workspace);
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
    const result = await adminApi.syncMails(nanoid, workspace);
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
      await adminApi.updateSignature(existing[0].nanoid, payload, workspace);
    } else {
      await adminApi.createSignature(payload, workspace);
    }
  } catch (error) {
    return fail(error, "The signature could not be saved.");
  }

  revalidateMailbox(workspace);
  return { status: "success", message: "Signature saved." };
}
