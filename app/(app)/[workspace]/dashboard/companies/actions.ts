"use server";

import { revalidatePath } from "next/cache";

import {
  bulkCompanyAction,
  createCompany,
  createIndustry,
  createTierClassification,
  deleteTierClassification,
  updateTierClassification,
  type BulkCompanyResult,
} from "@/lib/api";
import {
  BulkCompanyActionSchema,
  CreateTierClassificationSchema,
  NewCompanySchema,
  ProspectStatusSchema,
  UpdateTierClassificationSchema,
  fieldErrorsFromZod,
  type BulkCompanyActionInput,
  type NewCompanyInput,
} from "@/lib/schemas";
import {
  type CreateCompanyActionState,
  type CrmActionState,
} from "./action-state";
import { backendMessage } from "./_actions-helpers";

/**
 * Server Actions for the CRM company record.
 *
 * Every action takes the workspace domain explicitly and forwards it to the
 * fetcher: the CRM endpoints are tenant-scoped, and without the
 * `X-Workspace` header Django's middleware silently answers `200 OK` with
 * an empty list — a write would appear to succeed and change nothing.
 */

/**
 * Server Action: create a new company in the active workspace.
 *
 * Called from the "Add Company" dialog on the Companies list page. The form
 * posts every Company field plus the active workspace domain. On success we
 * `revalidatePath` so the list, breakdown cards, and detail pages refresh
 * without a full reload. Errors return a field-keyed map for inline display.
 */
export async function createCompanyAction(
  _prev: CreateCompanyActionState,
  formData: FormData,
): Promise<CreateCompanyActionState> {
  // Phone numbers and social links arrive as repeated `<input name="…">`
  // values. Pull them out before the schema sees the FormData.
  const phoneNumbers = formData.getAll("phone_numbers").map(String).filter(Boolean);
  const socialLinks = formData
    .getAll("social_links")
    .map((raw) => {
      try {
        return JSON.parse(String(raw));
      } catch {
        return null;
      }
    })
    .filter((v): v is { url: string; name?: string; is_primary?: boolean } =>
      v !== null && typeof v === "object" && typeof v.url === "string",
    );

  const raw = {
    workspace_domain: String(formData.get("workspace_domain") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    domain: String(formData.get("domain") ?? "").trim() || undefined,
    industry: String(formData.get("industry") ?? "").trim() || undefined,
    size: String(formData.get("size") ?? "").trim() || undefined,
    tier: String(formData.get("tier") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || undefined,
    country: String(formData.get("country") ?? "").trim() || undefined,
    city: String(formData.get("city") ?? "").trim() || undefined,
    address: String(formData.get("address") ?? "").trim() || undefined,
    about: String(formData.get("about") ?? "").trim() || undefined,
    status: ProspectStatusSchema.parse(
      String(formData.get("status") ?? "").trim() || "identified",
    ),
    verified: formData.get("verified") === "on" || formData.get("verified") === "true",
    total_listings:
      String(formData.get("total_listings") ?? "").trim() === ""
        ? undefined
        : Number(formData.get("total_listings")),
    phone_numbers: phoneNumbers.length > 0 ? phoneNumbers : undefined,
    social_links: socialLinks.length > 0 ? socialLinks : undefined,
  } satisfies NewCompanyInput;

  const parsed = NewCompanySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;
  const { workspace_domain, total_listings, ...rest } = data;

  try {
    await createCompany(
      {
        ...rest,
        ...(typeof total_listings === "number" ? { total_listings } : {}),
      },
      workspace_domain,
    );
  } catch (error) {
    console.error("createCompanyAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not create the company. The name may already exist, or the server may be unavailable.",
      ),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return {
    status: "success",
    message: `Company "${data.name}" created.`,
  };
}

/**
 * Server Action: create an industry on the fly.
 *
 * `Industry.name` is unique, so creating one that already exists answers
 * `400` — the message says so rather than failing vaguely.
 */
export async function createIndustryAction(input: {
  workspaceDomain: string;
  name: string;
}): Promise<CrmActionState> {
  const name = input.name.trim();
  if (!name) {
    return { status: "error", message: "Enter an industry name." };
  }
  try {
    await createIndustry({ name }, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(
        error,
        "Could not create the industry. It may already exist.",
      ),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return { status: "success", message: `Industry "${name}" created.` };
}

/**
 * Server Action: create a new tier classification.
 */
export async function createTierClassificationAction(
  _prev: CreateCompanyActionState,
  formData: FormData,
): Promise<CreateCompanyActionState> {
  const workspaceDomain = String(formData.get("workspace_domain") ?? "").trim();
  const raw = {
    title: String(formData.get("title") ?? "").trim() || undefined,
    label: String(formData.get("label") ?? "").trim() || undefined,
    description:
      String(formData.get("description") ?? "").trim() === ""
        ? {}
        : { html: String(formData.get("description")).trim() },
  };

  const parsed = CreateTierClassificationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
    };
  }

  try {
    await createTierClassification(parsed.data, workspaceDomain);
  } catch {
    return {
      status: "error",
      message: "Could not create the tier. Please try again.",
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return {
    status: "success",
    message: `Tier "${parsed.data.label}" created.`,
  };
}

/**
 * Server Action: rename a tier classification.
 */
export async function updateTierAction(input: {
  workspaceDomain: string;
  nanoid: string;
  title: string;
  label: string;
}): Promise<CrmActionState> {
  const parsed = UpdateTierClassificationSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    title: input.title,
    label: input.label,
  });
  if (!parsed.success) {
    return { status: "error", message: "Please fix the highlighted fields." };
  }

  try {
    await updateTierClassification(
      parsed.data.nanoid,
      { title: parsed.data.title, label: parsed.data.label },
      parsed.data.workspace_domain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not update the tier."),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return { status: "success", message: "Tier updated." };
}

/**
 * Server Action: delete a tier classification.
 */
export async function deleteTierAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<CrmActionState> {
  if (!input.workspaceDomain || !input.nanoid) {
    return { status: "error", message: "Missing tier." };
  }
  try {
    await deleteTierClassification(input.nanoid, input.workspaceDomain);
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not delete the tier."),
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return { status: "success", message: "Tier deleted." };
}

/**
 * Server Action: bulk-archive companies.
 *
 * Called from the bulk-action toolbar with the list of selected nanoids. One
 * request goes out for the whole selection — the backend does the set in a
 * single transaction, so there is no per-company fan-out to reconcile here.
 */
export async function bulkArchiveCompaniesAction(
  input: BulkCompanyActionInput,
): Promise<BulkCompanyResult> {
  const parsed = BulkCompanyActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      requested: 0,
      affected: 0,
      skipped: 0,
      not_found: 0,
      blocked: [],
      related: {},
    };
  }

  const result = await bulkCompanyAction(
    "archive",
    parsed.data.nanoids,
    parsed.data.workspace,
  );
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return result;
}

/**
 * Server Action: bulk-delete companies.
 *
 * Called from the bulk-action toolbar with the list of selected nanoids. One
 * request goes out for the whole selection. Companies that still have
 * records pointing at them cannot be deleted; the backend leaves those out
 * and reports them in `blocked`.
 */
export async function bulkDeleteCompaniesAction(
  input: BulkCompanyActionInput,
): Promise<BulkCompanyResult> {
  const parsed = BulkCompanyActionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      requested: 0,
      affected: 0,
      skipped: 0,
      not_found: 0,
      blocked: [],
      related: {},
    };
  }

  const result = await bulkCompanyAction(
    "delete",
    parsed.data.nanoids,
    parsed.data.workspace,
  );
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return result;
}
