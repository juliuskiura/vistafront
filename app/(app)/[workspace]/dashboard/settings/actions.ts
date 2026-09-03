"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { leaveWorkspace, updateWorkspace, checkDomainAvailability } from "@/lib/api";

export interface SettingsActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialSettingsState: SettingsActionState = { status: "idle" };

const DOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
const DOMAIN_MIN_LENGTH = 2;

function pickString(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

async function pickOtherWorkspaces(currentNanoid: string) {
  // Re-list on the server instead of trusting the form, so a malicious
  // payload can't pretend a workspace is the user's only one.
  const { listWorkspaces } = await import("@/lib/api");
  const list = await listWorkspaces();
  return list.filter((ws) => ws.nanoid !== currentNanoid);
}

/**
 * Server Action: rename the workspace and/or change its domain.
 *
 * Both fields are optional — partial PATCH. If the domain is changing, we
 * pre-flight `checkDomainAvailability` to give a friendly error before the
 * backend rejects it.
 */
export async function updateWorkspaceAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const nanoid = pickString(formData, "nanoid");
  const name = pickString(formData, "name");
  const domain = pickString(formData, "domain").toLowerCase();

  const fieldErrors: Record<string, string[]> = {};
  if (!nanoid) {
    fieldErrors.nanoid = ["Missing workspace. Refresh and try again."];
  }
  if (!name) {
    fieldErrors.name = ["Workspace name is required."];
  }
  if (!domain || !DOMAIN_PATTERN.test(domain) || domain.length < DOMAIN_MIN_LENGTH) {
    fieldErrors.domain = [
      "Use lowercase letters, digits, and dashes (e.g. acme-corp).",
    ];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    const availability = await checkDomainAvailability(domain);
    if (!availability.available) {
      return {
        status: "error",
        message:
          availability.reason === "format"
            ? "That domain has an invalid format."
            : "That domain is already taken.",
        fieldErrors: { domain: ["This domain is not available."] },
      };
    }
  } catch (error) {
    // Pre-flight failures shouldn't block the save — the backend will
    // validate again and reject with the same outcome.
    console.warn("checkDomainAvailability failed (continuing):", error);
  }

  let activeDomain: string;
  try {
    const { listWorkspaces } = await import("@/lib/api");
    const all = await listWorkspaces();
    const ws = all.find((w) => w.nanoid === nanoid);
    if (!ws) {
      return {
        status: "error",
        message: "Workspace not found.",
      };
    }
    activeDomain = ws.domain;
  } catch (error) {
    console.error("updateWorkspaceAction lookup failed:", error);
    return {
      status: "error",
      message: "Could not load the workspace.",
    };
  }

  try {
    await updateWorkspace(nanoid, { name, domain }, activeDomain);
  } catch (error) {
    console.error("updateWorkspaceAction failed:", error);
    return {
      status: "error",
      message:
        "We could not update the workspace. Please check the fields and try again.",
    };
  }

  // Domain changes affect the URL prefix — revalidate everything so
  // server-rendered nav and the workspace switcher pick up the new value.
  revalidatePath("/", "layout");
  return {
    status: "success",
    message: "Workspace settings saved.",
  };
}

/**
 * Server Action: leave the workspace.
 *
 * The user is removed from the membership list; the workspace itself is
 * preserved. We always redirect away after a successful leave so the user
 * lands somewhere sensible (another workspace if they have one, otherwise
 * the onboarding home).
 */
export async function leaveWorkspaceAction(
  _prev: SettingsActionState,
  formData: FormData,
): Promise<SettingsActionState> {
  const nanoid = pickString(formData, "nanoid");
  if (!nanoid) {
    return {
      status: "error",
      message: "Missing workspace. Refresh and try again.",
    };
  }

  const { listWorkspaces } = await import("@/lib/api");
    let activeDomain: string;
    try {
      const all = await listWorkspaces();
      const ws = all.find((w) => w.nanoid === nanoid);
      if (!ws) {
        return {
          status: "error",
          message: "Workspace not found.",
        };
      }
      activeDomain = ws.domain;
    } catch (error) {
      console.error("leaveWorkspaceAction lookup failed:", error);
      return {
        status: "error",
        message: "Could not load the workspace.",
      };
    }

    try {
      await leaveWorkspace(nanoid, activeDomain);
    } catch (error) {
    console.error("leaveWorkspaceAction failed:", error);
    return {
      status: "error",
      message: "We could not remove you from this workspace. Please try again.",
    };
  }

  revalidatePath("/", "layout");

  const others = await pickOtherWorkspaces(nanoid).catch(() => []);
  const fallback = others[0]
    ? `/${others[0].domain}/dashboard`
    : "/onboarding";
  redirect(fallback);
}