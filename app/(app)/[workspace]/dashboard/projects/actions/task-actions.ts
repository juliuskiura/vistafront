"use server";

import { revalidatePath } from "next/cache";

import { createTask, deleteTask, updateTask } from "@/lib/api";
import {
  CreateTaskSchema,
  UpdateTaskSchema,
  UpdateTaskStatusSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type ProjectActionState, type ProjectResultState } from "../action-state";
import { backendMessage, orNull, pick } from "../_actions-helpers";

/**
 * Server Actions for tasks.
 *
 * A task belongs to a project directly via its `project` FK, and may have a
 * parent task via `parent`.
 */

/**
 * Server Action: create a task.
 *
 * Bound to the "Add task" dialog on the project record.
 */
export async function createTaskAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = CreateTaskSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    title: pick(formData, "title"),
    description: pick(formData, "description"),
    project: pick(formData, "project"),
    parent: pick(formData, "parent"),
    assignee: pick(formData, "assignee"),
    status: pick(formData, "status") || "todo",
    priority: pick(formData, "priority") || "medium",
    due_date: pick(formData, "due_date"),
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
    await createTask(
      {
        title: data.title,
        description: data.description,
        project: data.project,
        parent: orNull(data.parent),
        assignee: orNull(data.assignee),
        status: data.status,
        priority: data.priority,
        due_date: orNull(data.due_date),
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("createTaskAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not create the task. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  return { status: "success", message: "Task added." };
}

/**
 * Server Action: save the task form.
 *
 * Used by both the task dialog on the project record and the edit form on
 * the task's own page.
 */
export async function updateTaskAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = UpdateTaskSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    nanoid: pick(formData, "nanoid"),
    title: pick(formData, "title"),
    description: pick(formData, "description"),
    project: pick(formData, "project"),
    parent: pick(formData, "parent"),
    assignee: pick(formData, "assignee"),
    status: pick(formData, "status") || "todo",
    priority: pick(formData, "priority") || "medium",
    due_date: pick(formData, "due_date"),
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
    await updateTask(
      data.nanoid,
      {
        title: data.title,
        description: data.description,
        project: orNull(data.project),
        parent: orNull(data.parent),
        assignee: orNull(data.assignee),
        status: data.status,
        priority: data.priority,
        due_date: orNull(data.due_date),
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("updateTaskAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not save the task. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  revalidatePath(
    `/${data.workspace_domain}/dashboard/projects/tasks/${data.nanoid}`,
  );
  return { status: "success", message: "Task saved." };
}

/**
 * Server Action: change a task's status from a row.
 *
 * The backend has no `complete` action on the task viewset, so completion
 * is a plain status PATCH — which also makes the viewset recompute the
 * parent deliverable, publishing it once its last task is done.
 */
export async function updateTaskStatusAction(input: {
  workspaceDomain: string;
  nanoid: string;
  status: string;
}): Promise<ProjectResultState> {
  const parsed = UpdateTaskStatusSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    nanoid: input.nanoid,
    status: input.status,
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "That status cannot be set.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await updateTask(data.nanoid, { status: data.status }, data.workspace_domain);
  } catch (error) {
    console.error("updateTaskStatusAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not change the status. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  revalidatePath(
    `/${data.workspace_domain}/dashboard/projects/tasks/${data.nanoid}`,
  );
  return { status: "success" };
}

/**
 * Server Action: delete a task.
 *
 * Also used for the bulk delete, which calls it once per selected task —
 * the deletes are independent, so a failure on one does not have to stop
 * the rest.
 */
export async function deleteTaskAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing task." };
  }

  try {
    await deleteTask(input.nanoid, domain);
  } catch (error) {
    console.error("deleteTaskAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not delete the task. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  revalidatePath(`${domain}/dashboard/projects/tasks/${input.nanoid}`);
  return { status: "success" };
}

/**
 * Server Action: delete several tasks at once.
 *
 * The bulk toolbar's confirm dialog says how many rows will go, and the
 * deletes run in parallel.
 */
export async function deleteTasksAction(input: {
  workspaceDomain: string;
  nanoids: string[];
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || input.nanoids.length === 0) {
    return { status: "error", message: "Select at least one task." };
  }

  const results = await Promise.all(
    input.nanoids.map((nanoid) =>
      deleteTask(nanoid, domain).then(
        () => true,
        (error: unknown) => {
          console.error(`deleteTasksAction failed for ${nanoid}:`, error);
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
      message: "None of the selected tasks could be deleted.",
    };
  }
  if (deleted < input.nanoids.length) {
    return {
      status: "error",
      message: `Deleted ${deleted} of ${input.nanoids.length} tasks. The rest could not be deleted.`,
    };
  }
  return { status: "success" };
}
