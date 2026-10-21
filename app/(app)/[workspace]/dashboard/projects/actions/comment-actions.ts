"use server";

import { revalidatePath } from "next/cache";

import { createComment, deleteComment } from "@/lib/api";
import { CreateCommentSchema, fieldErrorsFromZod } from "@/lib/schemas";
import { type ProjectActionState, type ProjectResultState } from "../action-state";
import { backendMessage, pick } from "../_actions-helpers";

/**
 * Server Actions for comments.
 *
 * Comments are a generic feature: the backend stores them against any
 * record through a content type plus a nanoid, so the same two actions
 * serve the task page and the deliverable page.
 */

/** Server Action: post a comment on a record. */
export async function createCommentAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = CreateCommentSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    target_type: pick(formData, "target_type"),
    target_nanoid: pick(formData, "target_nanoid"),
    text: pick(formData, "text"),
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
    await createComment(
      {
        target_type: data.target_type,
        target_nanoid: data.target_nanoid,
        text: data.text,
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("createCommentAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not post your comment. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  return { status: "success", message: "Comment posted." };
}

/** Server Action: delete a comment. The backend soft-deletes it. */
export async function deleteCommentAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing comment." };
  }

  try {
    await deleteComment(input.nanoid, domain);
  } catch (error) {
    console.error("deleteCommentAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not delete the comment. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  return { status: "success" };
}
