"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createProject, deleteProject, updateProject } from "@/lib/api";
import {
  CreateProjectSchema,
  UpdateProjectSchema,
  UpdateProjectStatusSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type ProjectActionState, type ProjectResultState } from "../action-state";
import { backendMessage, orNull, pick } from "../_actions-helpers";

/**
 * Server Actions for the project record.
 *
 * Every action takes the workspace domain explicitly and forwards it to the
 * fetcher: the projectmanager endpoints are tenant-scoped, and without the
 * `X-Workspace` header Django's middleware silently answers `200 OK` with an
 * empty list — a write would appear to succeed and change nothing.
 */

/**
 * Server Action: create a new project.
 *
 * Bound to the form on `/dashboard/projects/new`. On success we redirect
 * straight to the new project's record.
 */
export async function createProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = CreateProjectSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    name: pick(formData, "name"),
    description: pick(formData, "description"),
    company: pick(formData, "company"),
    client: pick(formData, "client"),
    category: pick(formData, "category"),
    status: pick(formData, "status") || "planning",
    priority: pick(formData, "priority") || "medium",
    start_date: pick(formData, "start_date"),
    deadline: pick(formData, "deadline"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  let createdNanoid: string;
  try {
    const created = await createProject(
      {
        name: data.name,
        description: data.description,
        company: data.company,
        client: orNull(data.client),
        category: orNull(data.category),
        status: data.status,
        priority: data.priority,
        start_date: orNull(data.start_date),
        deadline: orNull(data.deadline),
      },
      data.workspace_domain,
    );
    createdNanoid = created.nanoid;
  } catch (error) {
    console.error("createProjectAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not create the project. The company may no longer exist, or the server may be unavailable.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  // Outside the try: `redirect` throws, and a `catch` around it would
  // swallow the redirect and leave the user on the empty form.
  redirect(`/${data.workspace_domain}/dashboard/projects/${createdNanoid}`);
}

/**
 * Server Action: save the project form.
 *
 * Bound to the edit dialog on the project record. The company and the
 * client are relations, so an empty selection clears them.
 */
export async function updateProjectAction(
  _prev: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const parsed = UpdateProjectSchema.safeParse({
    workspace_domain: pick(formData, "workspace_domain"),
    nanoid: pick(formData, "nanoid"),
    name: pick(formData, "name"),
    description: pick(formData, "description"),
    company: pick(formData, "company"),
    client: pick(formData, "client"),
    category: pick(formData, "category"),
    status: pick(formData, "status") || "planning",
    priority: pick(formData, "priority") || "medium",
    start_date: pick(formData, "start_date"),
    deadline: pick(formData, "deadline"),
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
    await updateProject(
      data.nanoid,
      {
        name: data.name,
        description: data.description,
        company: data.company,
        client: orNull(data.client),
        category: orNull(data.category),
        status: data.status,
        priority: data.priority,
        start_date: orNull(data.start_date),
        deadline: orNull(data.deadline),
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("updateProjectAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not save the project. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects/${data.nanoid}`);
  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  return { status: "success", message: "Project saved." };
}

/**
 * Server Action: change a project's status from the record header.
 *
 * The payload is deliberately tiny — a status and a nanoid — so the dropdown
 * cannot smuggle a different column into the same PATCH.
 */
export async function updateProjectStatusAction(input: {
  workspaceDomain: string;
  nanoid: string;
  status: string;
}): Promise<ProjectResultState> {
  const parsed = UpdateProjectStatusSchema.safeParse({
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
    await updateProject(
      data.nanoid,
      { status: data.status },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("updateProjectStatusAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not change the status. Please try again.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects/${data.nanoid}`);
  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  return { status: "success" };
}

/**
 * Server Action: delete a project.
 *
 * The backend cascades — the project's deliverables and tasks go with it —
 * so the confirm dialog says so before the call is made.
 */
export async function deleteProjectAction(input: {
  workspaceDomain: string;
  nanoid: string;
}): Promise<ProjectResultState> {
  const domain = input.workspaceDomain;
  if (!domain || !input.nanoid) {
    return { status: "error", message: "Missing project." };
  }

  try {
    await deleteProject(input.nanoid, domain);
  } catch (error) {
    console.error("deleteProjectAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not delete the project. Please try again.",
      ),
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  redirect(`/${domain}/dashboard/projects`);
}
