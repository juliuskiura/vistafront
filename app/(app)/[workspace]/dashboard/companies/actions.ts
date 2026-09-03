"use server";

import { revalidatePath } from "next/cache";

import { createCompany, deleteCompany, createTierClassification } from "@/lib/api";
import {
  NewCompanySchema,
  ProspectStatusSchema,
  CreateTierClassificationSchema,
  fieldErrorsFromZod,
  type NewCompanyInput,
  type CreateTierClassificationInput,
} from "@/lib/schemas";

export interface CreateCompanyActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
}

export const initialCreateCompanyState: CreateCompanyActionState = {
  status: "idle",
};

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
      message:
        "We could not create the company. The name may already exist, or the server may be unavailable.",
    };
  }

  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return {
    status: "success",
    message: `Company "${data.name}" created.`,
  };
}

/**
 * Server Action: delete a company.
 *
 * Called from the bulk-action toolbar on the Companies table.
 * On success we `revalidatePath` so the list and breakdown cards refresh.
 */
export async function deleteCompanyAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  if (!nanoid || !workspace) return;
  try {
    await deleteCompany(nanoid, workspace);
  } catch (error) {
    console.error("deleteCompanyAction failed:", error);
  }
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
}

/**
 * Server Action: bulk-delete companies.
 *
 * Called from the bulk-action toolbar with the list of selected nanoids.
 * Runs the deletes in parallel and `revalidatePath`s once at the end.
 */
export async function bulkDeleteCompaniesAction(
  nanoids: string[],
  workspace: string,
): Promise<{ deleted: number; failed: number }> {
  if (!workspace || nanoids.length === 0) return { deleted: 0, failed: 0 };
  const results = await Promise.allSettled(
    nanoids.map((nanoid) => deleteCompany(nanoid, workspace)),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  const deleted = results.length - failed;
  revalidatePath(`/[workspace]/dashboard/companies`, "page");
  return { deleted, failed };
}

/**
 * Server Action: create a new tier classification.
 */
export interface CreateTierClassificationActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialCreateTierClassificationState: CreateTierClassificationActionState = {
  status: "idle",
};

export async function createTierClassificationAction(
  _prev: CreateTierClassificationActionState,
  formData: FormData,
): Promise<CreateTierClassificationActionState> {
  const workspaceDomain = String(formData.get("workspace_domain") ?? "").trim();
  const raw = {
    title: String(formData.get("title") ?? "").trim() || undefined,
    label: String(formData.get("label") ?? "").trim() || undefined,
    description:
      String(formData.get("description") ?? "").trim() === ""
        ? {}
        : { html: String(formData.get("description")).trim() },
  } satisfies CreateTierClassificationInput;

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