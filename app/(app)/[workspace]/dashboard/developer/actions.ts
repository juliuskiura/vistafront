"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createApplication,
  createKey,
  listKeys,
  revokeKey,
} from "@/lib/api/applications";
import {
  CreateApplicationSchema,
  CreateKeySchema,
  RevokeKeySchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { backendMessage } from "../projects/_actions-helpers";

/**
 * Result shape for actions that take a plain object rather than a form.
 * Used by row-level controls — create key, revoke key — which have no form.
 */
export interface DeveloperActionResult {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  /** The plaintext API key, returned exactly once on key creation. */
  apiKey?: string;
}

/**
 * Server Action: create a new developer application.
 */
export async function createApplicationAction(
  _prev: DeveloperActionResult,
  formData: FormData,
): Promise<DeveloperActionResult> {
  const parsed = CreateApplicationSchema.safeParse({
    workspace_domain: String(formData.get("workspace_domain") ?? "").trim(),
    application_name: String(formData.get("application_name") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim() || undefined,
    scopes: (() => {
      const raw = String(formData.get("scopes") ?? "").trim();
      return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    })(),
    is_active: String(formData.get("is_active") ?? "true") === "true",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await createApplication(
      {
        application_name: data.application_name,
        description: data.description,
        scopes: data.scopes,
        is_active: data.is_active,
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("createApplicationAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not create the application. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/developer`);
  return { status: "success", message: "Application created." };
}

/**
 * Server Action: list API keys for an application (metadata only).
 */
export async function getKeysAction(input: {
  workspaceDomain: string;
  applicationNanoid: string;
}): Promise<DeveloperActionResult & { keys: unknown[] }> {
  try {
    const keys = await listKeys(input.applicationNanoid, input.workspaceDomain);
    return { status: "success", keys };
  } catch (error) {
    console.error("getKeysAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not load the API keys. Please try again.",
      ),
      keys: [],
    };
  }
}

/**
 * Server Action: generate a new API key for an application.
 *
 * The backend returns the plaintext key exactly once. The caller must surface
 * it to the user — after this action returns, the secret is gone forever.
 */
export async function createKeyAction(
  _prev: DeveloperActionResult,
  formData: FormData,
): Promise<DeveloperActionResult> {
  const parsed = CreateKeySchema.safeParse({
    workspace_domain: String(formData.get("workspace_domain") ?? "").trim(),
    application_nanoid: String(formData.get("application_nanoid") ?? "").trim(),
    expires_at:
      String(formData.get("expires_at") ?? "").trim() || null,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  let createdKey: string;
  try {
    const result = await createKey(
      data.application_nanoid,
      { expires_at: data.expires_at },
      data.workspace_domain,
    );
    createdKey = result.api_key;
  } catch (error) {
    console.error("createKeyAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not generate the API key. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/developer`);
  return { status: "success", message: "API key generated.", apiKey: createdKey };
}

/**
 * Server Action: revoke (soft-delete) an API key by nanoid.
 */
export async function revokeKeyAction(input: {
  workspaceDomain: string;
  keyNanoid: string;
}): Promise<DeveloperActionResult> {
  const parsed = RevokeKeySchema.safeParse({
    workspace_domain: input.workspaceDomain,
    key_nanoid: input.keyNanoid,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Missing key.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await revokeKey(data.key_nanoid, data.workspace_domain);
  } catch (error) {
    console.error("revokeKeyAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not revoke the key. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/developer`);
  return { status: "success", message: "API key revoked." };
}
