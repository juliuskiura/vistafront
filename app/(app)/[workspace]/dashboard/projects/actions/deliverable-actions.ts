"use server";

import { revalidatePath } from "next/cache";

import {
  completeDeliverable,
  createDeliverable,
  deleteDeliverable,
  updateDeliverable,
} from "@/lib/api";
import {
  CreateDeliverableSchema,
  UpdateDeliverableSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type ProjectActionState, type ProjectResultState } from "../action-state";
import { backendMessage, orNull, pick } from "../_actions-helpers";

/**
 * Server Actions for creating, editing and deleting deliverables.
 *
 * The publish workflow lives in `workflow-actions.ts`; the merges live in
 * `merge-actions.ts`.
 */

/**
 * Server Action: create a deliverable.
 *
 * The project is fixed by the form (the record it was opened from), so it
 * is not a field the user can change.
 */
export async function createDeliverableAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = CreateDeliverableSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    project: pick(formData, "project"),
    title: pick(formData, "title"),
    description: pick(formData, "description"),
    deliverable_type: pick(formData, "deliverable_type"),
    status: pick(formData, "status") || "draft",
    due_date: pick(formData, "due_date"),
    assigned_to: pick(formData, "assigned_to"),
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
    await createDeliverable(
      {
        project: data.project,
        title: data.title,
        description: data.description,
        deliverable_type: orNull(data.deliverable_type),
        status: data.status,
        due_date: orNull(data.due_date),
        assigned_to: orNull(data.assigned_to),
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("createDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not create the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  return { status: "success", message: "Deliverable added." };
}

/**
 * Server Action: save the deliverable form.
 */
export async function updateDeliverableAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = UpdateDeliverableSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    nanoid: pick(formData, "nanoid"),
    title: pick(formData, "title"),
    description: pick(formData, "description"),
    deliverable_type: pick(formData, "deliverable_type"),
    status: pick(formData, "status") || "draft",
    due_date: pick(formData, "due_date"),
    assigned_to: pick(formData, "assigned_to"),
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
    await updateDeliverable(
      data.nanoid,
      {
        title: data.title,
        description: data.description,
        deliverable_type: orNull(data.deliverable_type),
        status: data.status,
        due_date: orNull(data.due_date),
        assigned_to: orNull(data.assigned_to),
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("updateDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not save the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  revalidatePath(
    `/${data.workspace_domain}/dashboard/deliverables/${data.nanoid}`,
  );
  return { status: "success", message: "Deliverable saved." };
}

/**
 * Server Action: delete a deliverable.
 *
 * The backend cascades: the deliverable's tasks go with it.
 */
export async function deleteDeliverableAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing deliverable." };
  }

  try {
    await deleteDeliverable(input.nanoid, domain);
  } catch (error) {
    console.error("deleteDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not delete the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  revalidatePath(`${domain}/dashboard/deliverables/${input.nanoid}`);
  return { status: "success" };
}

/**
 * Server Action: delete several deliverables at once.
 */
export async function deleteDeliverablesAction(input: {
  workspaceDomain: string;
  nanoids: string[];
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || input.nanoids.length === 0) {
    return { status: "error", message: "Select at least one deliverable." };
  }

  const results = await Promise.all(
    input.nanoids.map((nanoid) =>
      deleteDeliverable(nanoid, domain).then(
        () => true,
        (error: unknown) => {
          console.error(`deleteDeliverablesAction failed for ${nanoid}:`, error);
          return false;
        },
      ),
    ),
  );

  revalidatePath(`/${domain}/dashboard/projects`);

  const deleted = results.filter(Boolean).length;
  if (deleted === 0) {
    return {
      status: "error",
      message: "None of the selected deliverables could be deleted.",
    };
  }
  if (deleted < input.nanoids.length) {
    return {
      status: "error",
      message: `Deleted ${deleted} of ${input.nanoids.length} deliverables. The rest could not be deleted.`,
    };
  }
  return { status: "success" };
}

/**
 * Server Action: complete a deliverable.
 *
 * The backend marks the deliverable published and its tasks done, then
 * recomputes the project.
 */
export async function completeDeliverableAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing deliverable." };
  }

  try {
    await completeDeliverable(input.nanoid, domain);
  } catch (error) {
    console.error("completeDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not complete the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  revalidatePath(`${domain}/dashboard/deliverables/${input.nanoid}`);
  return { status: "success" };
}

/**
 * Server Action: cancel a deliverable.
 *
 * Cancelling is a status change, not a delete: the record and its tasks
 * stay, they just stop being live work.
 */
export async function cancelDeliverableAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing deliverable." };
  }

  try {
    await updateDeliverable(
      input.nanoid,
      { status: "cancelled" },
      domain,
    );
  } catch (error) {
    console.error("cancelDeliverableAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not cancel the deliverable. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  revalidatePath(`${domain}/dashboard/deliverables/${input.nanoid}`);
  return { status: "success" };
}
