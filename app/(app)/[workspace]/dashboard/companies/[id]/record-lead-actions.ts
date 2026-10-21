"use server";

import { revalidatePath } from "next/cache";

import { createLead, deleteLead } from "@/lib/api";
import { CreateLeadSchema, fieldErrorsFromZod } from "@/lib/schemas";
import { type CrmActionState } from "../action-state";
import { backendMessage } from "../_actions-helpers";

/**
 * Server Actions for the leads on a company record.
 */

/* ──────────────────────────────────────────────────────────────────────
 * Leads
 * ────────────────────────────────────────────────────────────────────── */

export async function createLeadAction(input: {
  workspaceDomain: string;
  company: string;
  contact?: string;
  source: string;
  status: string;
  notes?: string;
}): Promise<CrmActionState> {
  const parsed = CreateLeadSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    company: input.company,
    contact: input.contact,
    source: input.source,
    status: input.status,
    notes: input.notes,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  try {
    await createLead(
      {
        company: parsed.data.company,
        source: parsed.data.source,
        status: parsed.data.status,
        ...(parsed.data.contact ? { contact: parsed.data.contact } : {}),
        ...(parsed.data.notes ? { notes: parsed.data.notes } : {}),
      },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the lead."),
    };
  }

  revalidateCompany(parsed.data.workspace_domain, parsed.data.company, "leads");
  return { status: "success", message: "Lead added." };
}

export async function deleteLeadAction(input: {
  workspaceDomain: string;
  nanoid: string;
  company: string;
}): Promise<CrmActionState> {
  try {
    await deleteLead(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the lead."),
    };
  }
  revalidateCompany(input.workspaceDomain, input.company, "leads");
  return { status: "success", message: "Lead deleted." };
}

function revalidateCompany(
  workspaceDomain: string,
  companyNanoid: string,
  listPath?: string,
) {
  revalidatePath(`/[workspace]/dashboard/companies/${companyNanoid}`, "page");
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  if (listPath) {
    revalidatePath(`/[workspace]/dashboard/companies/${listPath}`, "page");
  }
}
