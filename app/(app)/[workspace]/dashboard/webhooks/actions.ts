"use server";

import { z, flattenError } from "zod";
import { revalidatePath } from "next/cache";

import {
  createWebhook,
  deleteWebhook,
  updateWebhook,
} from "@/lib/api";

/**
 * The contract for saving one webhook registration.
 *
 * Blank is a meaningful value throughout, not "not supplied": an empty
 * `client_id` means "inherit the platform's". So the schema coerces an empty
 * string to `null` rather than rejecting it, and the action always sends the
 * complete field set — which is what makes clearing a field possible at all. A
 * partial update would leave a previously-set value behind, and there would be
 * no way back to inheriting.
 *
 * `platform` is the platform's **nanoid**, not its slug, because the backend
 * serializer resolves the relation by nanoid. Sending a slug fails with a
 * validation error naming an unknown object, which reads as "that platform
 * does not exist" when it very much does.
 *
 * `workspace` travels in the form rather than being inferred, so a crafted
 * request cannot redirect the write at a different workspace than the one the
 * operator is looking at.
 */
export const WebhookSchema = z.object({
  platform: z.string().min(1, "Choose which platform this webhook serves."),
  name: z
    .string()
    .min(1, "Name this webhook so it can be told apart.")
    .max(100, "Keep the name under 100 characters."),
  workspace: z.string().min(1, "Missing workspace."),
  client_id: z
    .string()
    .max(255, "App IDs are at most 255 characters.")
    .transform((v) => v.trim() || null),
  callback_url: z
    .string()
    .max(2048, "Callback URLs are at most 2048 characters.")
    .transform((v) => v.trim() || null),
  secret_env_var: z
    .string()
    .max(100, "Settings keys are at most 100 characters.")
    .transform((v) => v.trim() || null),
  subscribed_fields: z
    .string()
    .max(2000, "That field list is implausibly long.")
    .transform((v) => v.trim() || null),
  is_active: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
});

export type WebhookActionState = {
  status: "idle" | "success" | "error";
  message: string;
  /** Set when the failure was per-field, so the form can mark the inputs. */
  fieldErrors?: Record<string, string[]>;
};

const IDLE: WebhookActionState = { status: "idle", message: "" };

/**
 * Create or update one registration.
 *
 * An empty `nanoid` means create; a present one means update that row. Both go
 * through the same schema because both accept the same shape, and having two
 * schemas for two halves of one form is how they drift apart.
 *
 * The success message names the thing that does *not* happen when you save
 * here: nothing is sent to Meta. Saving records what the callback should be;
 * the App dashboard is still where it has to be registered. Without that
 * sentence, a green "saved" reads as "done" and the deliveries still never
 * arrive.
 *
 * Args:
 *    _prev: The previous state, unused — accepted because `useActionState`
 *        passes it. Errors are returned as state, not thrown, so the form can
 *        render them inline.
 *    formData: The submitted form.

 * Returns:
 *    WebhookActionState: Status, a message for the operator, and per-field
 *    errors when validation failed.
 */
export async function saveWebhookAction(
  _prev: WebhookActionState,
  formData: FormData,
): Promise<WebhookActionState> {
  const parsed = WebhookSchema.safeParse(
    Object.fromEntries(formData),
  );

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors,
    };
  }

  const { platform, name, workspace, client_id, callback_url, secret_env_var, subscribed_fields, is_active } =
    parsed.data;

  // Present only when editing an existing row; absent on the create form.
  const nanoid = String(formData.get("nanoid") ?? "");
  const isUpdate = nanoid !== "";

  // The complete set, always. Sent in full so clearing a field writes null
  // rather than leaving the previous value untouched.
  const body = {
    platform,
    name,
    client_id,
    callback_url,
    secret_env_var,
    subscribed_fields,
    is_active,
  };

  try {
    if (isUpdate) {
      await updateWebhook(nanoid, body, workspace);
    } else {
      await createWebhook(body, workspace);
    }
  } catch (error) {
    // A console-only write refused by the backend arrives here as a thrown
    // error whose message is the useful part — it names the actual reason — so
    // it is passed through rather than replaced with something generic.
    return {
      status: "error",
      message:
        error instanceof Error && error.message
          ? error.message
          : "Could not reach the server.",
    };
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message: isUpdate
      ? "Saved. Meta still needs the callback URL registered on the App this row names — nothing was sent to Meta."
      : "Created. Meta still needs the callback URL registered on the App this row names — nothing was sent to Meta.",
  };
}

/**
 * Delete one registration.
 *
 * Not a `useActionState` action: it is triggered by a button in a dialog
 * rather than by a form submission, so it is a plain call whose result the
 * caller holds in local state.
 *
 * The returned message states what deletion does *not* do, because "deleted"
 * otherwise reads as "this is fixed" when the App is still posting to that
 * callback URL and we have merely stopped recording what it was pointed at.
 *
 * Args:
 *    input: ``{ nanoid, workspace }``.

 * Returns:
 *    WebhookActionState: Status plus a message for the operator.
 */
export async function deleteWebhookAction(input: {
  nanoid: string;
  workspace: string;
}): Promise<WebhookActionState> {
  try {
    await deleteWebhook(input.nanoid, input.workspace);
  } catch (error) {
    return {
      status: "error",
      message:
        error instanceof Error && error.message
          ? error.message
          : "Could not reach the server.",
    };
  }

  revalidatePath("/", "layout");

  return {
    status: "success",
    message:
      "Deleted. Meta is still sending to that callback URL until the App is changed — this only removed our record of it.",
  };
}

export { IDLE as WEBHOOK_IDLE };