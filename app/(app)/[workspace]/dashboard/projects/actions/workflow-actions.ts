"use server";

import { revalidatePath } from "next/cache";

import {
  approveDeliverable,
  publishDeliverable,
  requestRevisions,
  submitReview,
} from "@/lib/api";
import {
  RequestRevisionsSchema,
  ReviewSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type ProjectActionState, type ProjectResultState } from "../action-state";
import { backendMessage, pick } from "../_actions-helpers";

/**
 * Server Actions for the publish workflow.
 *
 * The workflow is a one-way ladder: `draft` → `review` → `approved` →
 * `published`, with `revisions` as the loop back. The backend exposes one
 * action per step, and which step is offered follows from the
 * deliverable's current status.
 */

/**
 * Server Action: move a deliverable into review.
 *
 * The same action serves "Submit for review" and "Resubmit for review" —
 * the backend sets the status to `review` either way.
 */
export async function submitReviewAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing deliverable." };
  }

  try {
    await submitReview(input.nanoid, domain);
  } catch (error) {
    console.error("submitReviewAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not submit the deliverable for review. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  revalidatePath(`${domain}/dashboard/deliverables/${input.nanoid}`);
  return { status: "success" };
}

/**
 * Server Action: approve a deliverable.
 *
 * The backend records the signed-in user as the reviewer and stores the
 * notes. The notes are optional — the legacy dialog allowed approving with
 * an empty note.
 */
export async function approveDeliverableAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = ReviewSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    nanoid: pick(formData, "nanoid"),
    review_notes: pick(formData, "review_notes"),
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
    await approveDeliverable(
      data.nanoid,
      data.review_notes ?? "",
      data.workspace_domain,
    );
  } catch (error) {
    console.error("approveDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not approve the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  revalidatePath(
    `/${data.workspace_domain}/dashboard/deliverables/${data.nanoid}`,
  );
  return { status: "success", message: "Deliverable approved." };
}

/**
 * Server Action: send a deliverable back for revisions.
 *
 * Notes are required here: asking for revisions without saying what to
 * change is the one case where the comment is the whole point.
 */
export async function requestRevisionsAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = RequestRevisionsSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    nanoid: pick(formData, "nanoid"),
    review_notes: pick(formData, "review_notes"),
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
    await requestRevisions(
      data.nanoid,
      data.review_notes,
      data.workspace_domain,
    );
  } catch (error) {
    console.error("requestRevisionsAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not request revisions. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  revalidatePath(
    `/${data.workspace_domain}/dashboard/deliverables/${data.nanoid}`,
  );
  return { status: "success", message: "Revisions requested." };
}

/**
 * Server Action: publish an approved deliverable.
 */
export async function publishDeliverableAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing deliverable." };
  }

  try {
    await publishDeliverable(input.nanoid, domain);
  } catch (error) {
    console.error("publishDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not publish the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  revalidatePath(`${domain}/dashboard/deliverables/${input.nanoid}`);
  return { status: "success" };
}
