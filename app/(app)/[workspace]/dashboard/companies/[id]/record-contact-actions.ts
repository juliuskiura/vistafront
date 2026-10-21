"use server";

import { revalidatePath } from "next/cache";

import { createContact, deleteContact } from "@/lib/api";
import { CreateContactSchema, fieldErrorsFromZod } from "@/lib/schemas";
import { type CrmActionState } from "../action-state";
import { backendMessage } from "../_actions-helpers";

/**
 * Server Actions for the contacts on a company record.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Contacts
 * ────────────────────────────────────────────────────────────────────── */

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

  revalidatePath("/[workspace]/dashboard/contacts", "page");
  revalidateCompany(parsed.data.workspace_domain, parsed.data.company);
  return { status: "success", message: "Contact added." };
}

export async function deleteContactAction(input: {
  workspaceDomain: string;
  nanoid: string;
  company: string;
}): Promise<CrmActionState> {
  try {
    await deleteContact(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the contact."),
    };
  }
  revalidatePath("/[workspace]/dashboard/contacts", "page");
  revalidateCompany(input.workspaceDomain, input.company);
  return { status: "success", message: "Contact deleted." };
}

function revalidateCompany(workspaceDomain: string, companyNanoid: string) {
  revalidatePath(`/[workspace]/dashboard/companies/${companyNanoid}`, "page");
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
}
