"use server";

import { revalidatePath } from "next/cache";

import { deleteAttachment } from "@/lib/api";
import { serverMutateFormData } from "@/lib/media/server-mutate-formdata";
import { type ProjectActionState, type ProjectResultState } from "../action-state";
import { backendMessage, pick } from "../_actions-helpers";

/**
 * Server Actions for attachments.
 *
 * An upload is multipart, which the JSON-only `serverMutate` base cannot
 * carry, so it goes through `serverMutateFormData` — the same helper the
 * livechat attachment route uses. Everything else about the flow (the
 * cookies, the CSRF token, the `X-Workspace` header) is identical to the
 * rest of the app; only the body differs.
 */

/**
 * Server Action: attach a file to a record.
 *
 * The file arrives in the `FormData` as a `File`. It is re-wrapped with the
 * two target fields the backend expects and posted as multipart.
 */
export async function uploadAttachmentAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const workspaceDomain = pick(formData, "workspace_domain");
  const targetType = pick(formData, "target_type");
  const targetNanoid = pick(formData, "target_nanoid");
  const file = formData.get("file");

  if (!workspaceDomain || !targetType || !targetNanoid) {
    return { status: "error", message: "Missing record." };
  }

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: "error",
      message: "Choose a file to attach.",
      fieldErrors: { file: ["Choose a file to attach."] },
    };
  }

  const body = new FormData();
  body.append("target_type", targetType);
  body.append("target_nanoid", targetNanoid);
  body.append("file", file, file.name);

  try {
    await serverMutateFormData("/apis/attachments/", body, {
      workspace: workspaceDomain,
    });
  } catch (error) {
    console.error("uploadAttachmentAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not attach the file. Please try again.",
      ),
    };
  }

  revalidatePath(`/${workspaceDomain}/dashboard/projects`);
  return { status: "success", message: "File attached." };
}

/** Server Action: remove an attachment. */
export async function deleteAttachmentAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing attachment." };
  }

  try {
    await deleteAttachment(input.nanoid, domain);
  } catch (error) {
    console.error("deleteAttachmentAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not remove the file. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  return { status: "success" };
}
