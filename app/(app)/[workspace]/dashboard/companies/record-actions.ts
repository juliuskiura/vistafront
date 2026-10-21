"use server";

import { revalidatePath } from "next/cache";

import {
  advanceCompany,
  deleteCompany,
  updateCompany,
} from "@/lib/api";
import {
  ProspectStatusSchema,
  UpdateCompanyFieldSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { parseSocialLinks } from "@/lib/crm/social-links";
import { type CrmActionState } from "./action-state";
import { backendMessage } from "./_actions-helpers";

/**
 * Server Actions that mutate a single company record.
 *
 * The record edits one field at a time, so the payload is `{ field, value }`
 * rather than a partial record. The field name is whitelisted here, so a
 * crafted request cannot write to a column the inline editors never expose.
 */
export async function updateCompanyFieldAction(
  input: {
    workspaceDomain: string;
    nanoid: string;
    field: string;
    value: string;
  },
): Promise<CrmActionState> {
  const parsed = UpdateCompanyFieldSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    field: input.field,
    value: input.value,
  });
  if (!parsed.success) {
    return {
      status: "error",
      message: "That field cannot be saved.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { workspace_domain, nanoid, field, value } = parsed.data;

  // The value arrives as a string and has to be cast to the type the
  // serializer expects for this particular column.
  let body: Record<string, unknown>;
  switch (field) {
    case "verified":
      body = { verified: value === "true" };
      break;
    case "total_listings":
      body = { total_listings: value === "" ? null : Number(value) };
      break;
    case "status":
      body = { status: ProspectStatusSchema.parse(value) };
      break;
    case "tier":
      body = { tier: value === "" ? null : value };
      break;
    case "phone_numbers":
      body = {
        phone_numbers: value
          .split("\n")
          .map((v) => v.trim())
          .filter(Boolean),
      };
      break;
    case "social_links":
      body = { social_links: parseSocialLinks(value) };
      break;
    default:
      body = { [field]: value };
  }

  try {
    await updateCompany(nanoid, body, workspace_domain);
  } catch (error) {
    console.error("updateCompanyFieldAction failed:", error);
    return {
      status: "error",
      message: backendMessage(error, "Could not save that change."),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies/${nanoid}`, "page");
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return { status: "success", message: "Saved." };
}

/**
 * Server Action: advance the company one stage along the prospecting flow.
 *
 * The endpoint takes no body and answers `400` with
 * `{ detail: "Company is already at the final prospecting stage." }` at the
 * end of the flow, so that message is surfaced rather than swallowed.
 */
export async function advanceCompanyAction(
  input: { workspaceDomain: string; nanoid: string },
): Promise<CrmActionState> {
  if (!input.workspaceDomain || !input.nanoid) {
    return { status: "error", message: "Missing company." };
  }
  try {
    await advanceCompany(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(
        error,
        "Could not advance the company to the next stage.",
      ),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies/${input.nanoid}`, "page");
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return { status: "success", message: "Advanced to the next stage." };
}

/**
 * Server Action: delete a company.
 *
 * The backend answers `409` with a human message when the company is still
 * referenced by contacts or deals. That message is surfaced verbatim —
 * "please delink the contact first" is actionable, "could not delete" is
 * not.
 */
export async function deleteCompanyAction(
  nanoid: string,
  workspace: string,
): Promise<CrmActionState> {
  if (!nanoid || !workspace) {
    return { status: "error", message: "Missing company." };
  }
  try {
    await deleteCompany(nanoid, workspace);
  } catch (error) {
    console.error("deleteCompanyAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "Could not delete the company. It may still be referenced by other records.",
      ),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  revalidatePath(`/[workspace]/dashboard/companies/${nanoid}`, "page");
  return { status: "success", message: "Company deleted." };
}

