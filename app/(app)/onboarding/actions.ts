"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  checkDomainAvailability,
  createClientBusiness,
  createWorkspace,
  redeemInvitation,
  type CreateClientBusinessBody,
  type CreateWorkspaceBody,
} from "@/lib/api";
import { getAuthUser } from "@/lib/auth/server";
import type { AuthActionState } from "@/lib/auth/action-state";

const DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function readFieldErrors(
  payload: unknown,
): { fieldErrors: Record<string, string[]>; message: string } {
  const fieldErrors: Record<string, string[]> = {};
  let message = "We could not save your changes. Please review the fields below.";

  if (!payload || typeof payload !== "object") {
    return { fieldErrors, message };
  }

  const obj = payload as Record<string, unknown>;

  if (Array.isArray(obj.errors)) {
    for (const entry of obj.errors) {
      if (!entry || typeof entry !== "object") continue;
      const e = entry as { attr?: unknown; detail?: unknown };
      const attr = typeof e.attr === "string" ? e.attr : null;
      const detail = typeof e.detail === "string" ? e.detail : null;
      if (!detail) continue;
      if (attr) {
        fieldErrors[attr] = [...(fieldErrors[attr] ?? []), detail];
      } else {
        message = detail;
      }
    }
    return { fieldErrors, message };
  }

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
      fieldErrors[key] = value as string[];
    } else if (typeof value === "string") {
      fieldErrors[key] = [value];
    }
  }
  return { fieldErrors, message };
}

/**
 * Server Action: register a brand-new business AND its first workspace in
 * one step. Used by the onboarding home for users who have nothing yet.
 */
export async function createBusinessAndWorkspaceAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const businessBody: CreateClientBusinessBody = {
    legal_name: String(formData.get("legal_name") ?? "").trim(),
    country: String(formData.get("country") ?? "").trim() || undefined,
  };
  const workspaceName = String(formData.get("workspace_name") ?? "").trim();
  const rawDomain = String(formData.get("domain") ?? "").trim();
  const domain = slugify(rawDomain);

  const fieldErrors: Record<string, string[]> = {};
  if (!businessBody.legal_name) {
    fieldErrors.legal_name = ["Business name is required."];
  }
  if (!workspaceName) {
    fieldErrors.workspace_name = ["Workspace name is required."];
  }
  if (!domain || !DOMAIN_PATTERN.test(domain)) {
    fieldErrors.domain = [
      "Use lowercase letters, digits, and dashes (e.g. acme-corp).",
    ];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  let business;
  try {
    business = await createClientBusiness(businessBody);
  } catch (error) {
    console.error("createClientBusiness failed:", error);
    return {
      status: "error",
      message: "We could not create your business. Please try again.",
    };
  }

  let workspace;
  try {
    workspace = await createWorkspace({
      name: workspaceName,
      domain,
      client_business: business.nanoid,
    });
  } catch (error) {
    console.error("createWorkspace failed:", error);
    return {
      status: "error",
      message: "We could not create your workspace. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect(`/${workspace.domain}/dashboard`);
}

/**
 * Server Action: create a workspace under an already-registered business.
 * Used when a user already has a business (e.g. a returning user on the
 * team) and is adding a new workspace to it.
 */
export async function createWorkspaceAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const business = String(formData.get("business") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const rawDomain = String(formData.get("domain") ?? "").trim();
  const domain = slugify(rawDomain);

  const fieldErrors: Record<string, string[]> = {};
  if (!business) {
    fieldErrors.business = ["Missing business. Start again from onboarding."];
  }
  if (!name) {
    fieldErrors.name = ["Workspace name is required."];
  }
  if (!domain || !DOMAIN_PATTERN.test(domain)) {
    fieldErrors.domain = [
      "Use lowercase letters, digits, and dashes (e.g. acme-corp).",
    ];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  if (business && domain) {
    try {
      const availability = await checkDomainAvailability(domain);
      if (!availability.available) {
        return {
          status: "error",
          message:
            availability.reason === "format"
              ? "Use lowercase letters, digits, and dashes only."
              : "That domain is already taken.",
          fieldErrors: { domain: ["This domain is not available."] },
        };
      }
    } catch (error) {
      console.error("checkDomainAvailability failed:", error);
    }
  }

  const body: CreateWorkspaceBody = { name, domain, client_business: business };
  let workspace;
  try {
    workspace = await createWorkspace(body);
  } catch (error) {
    console.error("createWorkspaceAction failed:", error);
    return {
      status: "error",
      message: "We could not create your workspace. Please try again.",
    };
  }

  revalidatePath("/", "layout");
  redirect(`/${workspace.domain}/dashboard`);
}

/**
 * Server Action: redeem an invite code and jump straight into the joined
 * workspace.
 */
export async function redeemInviteAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const code = String(formData.get("code") ?? "").trim();

  if (!code) {
    return {
      status: "error",
      message: "Enter the invite code or link you received.",
      fieldErrors: { code: ["Invite code is required."] },
    };
  }

  let result;
  try {
    result = await redeemInvitation({ code });
  } catch (error) {
    console.error("redeemInviteAction failed:", error);
    return {
      status: "error",
      message: "This invite code is invalid or has expired.",
    };
  }

  revalidatePath("/", "layout");
  redirect(result.redirect_url || `/${result.workspace_nanoid}/dashboard`);
}

/**
 * Server Action: let the signed-in user skip onboarding when they already
 * belong to a workspace but haven't entered the app yet. Sends them to the
 * backend-issued `redirect_url`, or to `/onboarding` if there's nothing to
 * resume.
 */
export async function skipOnboardingAction(): Promise<void> {
  const user = await getAuthUser();
  redirect(user?.redirect_url || "/onboarding");
}
