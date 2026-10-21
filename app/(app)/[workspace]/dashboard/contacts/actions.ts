"use server";

import { revalidatePath } from "next/cache";

import { createContact, deleteContact, updateContact } from "@/lib/api";
import {
  CreateContactSchema,
  UpdateContactSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type CrmActionState } from "../companies/action-state";
import { backendMessage } from "../companies/_actions-helpers";

/**
 * Server Actions for the contacts feature.
 *
 * Every action forwards the workspace domain: the CRM endpoints are
 * tenant-scoped, and without the `X-Workspace` header Django answers
 * `200 OK` with an empty list.
 */

function revalidateContacts(workspaceDomain: string) {
  revalidatePath("/[workspace]/dashboard/contacts", "page");
  revalidatePath("/[workspace]/dashboard/companies", "page");
}

/**
 * Create a contact.
 */
export async function createContactAction(input: {
  workspaceDomain: string;
  company: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  notes?: string;
  status?: "active" | "inactive" | "lead";
}): Promise<CrmActionState> {
  const parsed = CreateContactSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    company: input.company,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    position: input.position,
    notes: input.notes,
    status: input.status,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createContact(
      {
        company: parsed.data.company,
        first_name: parsed.data.first_name,
        ...(parsed.data.last_name ? { last_name: parsed.data.last_name } : {}),
        ...(parsed.data.email ? { email: parsed.data.email } : {}),
        ...(parsed.data.phone ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.position ? { position: parsed.data.position } : {}),
        ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
        status: parsed.data.status,
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the contact."),
    };
  }

  revalidateContacts(parsed.data.workspace_domain);
  return { status: "success", message: "Contact created." };
}

/**
 * Update a contact.
 */
export async function updateContactAction(input: {
  workspaceDomain: string;
  nanoid: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  position?: string;
  company?: string;
  notes?: string;
  status?: "active" | "inactive" | "lead";
}): Promise<CrmActionState> {
  const parsed = UpdateContactSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    first_name: input.first_name,
    last_name: input.last_name,
    email: input.email,
    phone: input.phone,
    position: input.position,
    company: input.company,
    notes: input.notes,
    status: input.status,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await updateContact(
      parsed.data.nanoid,
      {
        first_name: parsed.data.first_name,
        ...(parsed.data.last_name !== undefined
          ? { last_name: parsed.data.last_name }
          : {}),
        ...(parsed.data.email !== undefined ? { email: parsed.data.email } : {}),
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(parsed.data.position !== undefined
          ? { position: parsed.data.position }
          : {}),
        ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes } : {}),
        ...(parsed.data.status ? { status: parsed.data.status } : {}),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not update the contact."),
    };
  }

  revalidateContacts(parsed.data.workspace_domain);
  revalidatePath(
    `/[workspace]/dashboard/contacts/${parsed.data.nanoid}`,
    "page",
  );
  return { status: "success", message: "Contact updated." };
}

/**
 * Delete a contact.
 */
export async function deleteContactAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<CrmActionState> {
  if (!input.workspaceDomain || !input.nanoid) {
    return { status: "error", message: "Missing contact." };
  }
  try {
    await deleteContact(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the contact."),
    };
  }

  revalidateContacts(input.workspaceDomain);
  return { status: "success", message: "Contact deleted." };
}
