"use server";

import { z, flattenError } from "zod";
import { revalidatePath } from "next/cache";

import { createWebhook, deleteWebhook, updateWebhook } from "@/lib/api";

/**
 * Only async functions are exported from a `"use server"` file. Next compiles
 * every export into a client reference, so exporting a plain object (a Zod
 * schema, an idle state) hands the component a reference proxy instead of the
 * value and the render dies with "An unexpected response was received from the
 * server". So the schema and the state shape live inside the functions.
 *
 * Blank is a real value: an empty field means "inherit from the platform". The
 * form always submits every field, so clearing one writes null instead of
 * leaving the old value behind.
 */
export async function saveWebhookAction(
  _prev: { status: string; message: string; fieldErrors?: Record<string, string[]> },
  formData: FormData,
) {
  const schema = z.object({
    platform: z.string().min(1, "Choose a platform."),
    name: z.string().min(1, "Name this webhook.").max(100),
    workspace: z.string().min(1),
    client_id: z.string().max(255).optional().transform((v) => v?.trim() || null),
    callback_url: z.string().max(2048).optional().transform((v) => v?.trim() || null),
    secret_env_var: z.string().max(100).optional().transform((v) => v?.trim() || null),
    subscribed_fields: z.string().max(2000).optional().transform((v) => v?.trim() || null),
    is_active: z.string().optional().transform((v) => v !== "false"),
  });

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors,
    };
  }

  const { platform, name, workspace, ...rest } = parsed.data;
  const nanoid = String(formData.get("nanoid") ?? "");
  const body = { platform, name, ...rest };

  try {
    if (nanoid) {
      await updateWebhook(nanoid, body, workspace);
    } else {
      await createWebhook(body, workspace);
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not save.",
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: nanoid
      ? "Saved. Meta still needs the callback URL registered on that App — nothing was sent to Meta."
      : "Created. Meta still needs the callback URL registered on that App — nothing was sent to Meta.",
  };
}

/**
 * Deletes the row. That is *all* it does — it does not unregister anything at
 * Meta, and the message says so, because "deleted" otherwise reads as "fixed"
 * while the App keeps posting to that callback URL.
 */
export async function deleteWebhookAction(input: {
  nanoid: string;
  workspace: string;
}) {
  try {
    await deleteWebhook(input.nanoid, input.workspace);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Could not delete.",
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message:
      "Deleted. Meta is still sending to that callback URL until you change the App — this only removed our record of it.",
  };
}