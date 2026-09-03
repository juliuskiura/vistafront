"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createProject,
  type CreateProjectBody,
  type Project,
} from "@/lib/api";

export interface CreateProjectActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
  createdNanoid?: string;
}

export const initialCreateProjectState: CreateProjectActionState = {
  status: "idle",
};

function pickString(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Server Action: create a new project from the `/dashboard/projects/new`
 * form. The form posts the active workspace domain (hidden), a `name`,
 * a `company` nanoid (required), an optional `client` contact nanoid,
 * optional `category`, `status`, `priority`, `start_date`, `deadline`,
 * and a `description`. On success we `redirect` straight to the new
 * project's detail page.
 */
export async function createProjectAction(
  _prev: CreateProjectActionState,
  formData: FormData,
): Promise<CreateProjectActionState> {
  const domain = pickString(formData, "workspace_domain");
  const name = pickString(formData, "name");
  const company = pickString(formData, "company");
  const client = pickString(formData, "client");
  const category = pickString(formData, "category");
  const status = pickString(formData, "status") || "planning";
  const priority = pickString(formData, "priority") || "medium";
  const startDate = pickString(formData, "start_date");
  const deadline = pickString(formData, "deadline");
  const description = pickString(formData, "description");

  const fieldErrors: Record<string, string[]> = {};
  if (!name) fieldErrors.name = ["Name is required."];
  if (!company) fieldErrors.company = ["Company is required."];
  if (!domain) {
    fieldErrors.workspace_domain = ["Missing workspace context."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const body: CreateProjectBody = {
    name,
    company,
    description,
    client: client || null,
    category: category || null,
    status: status as CreateProjectBody["status"],
    priority: priority as CreateProjectBody["priority"],
    start_date: startDate || null,
    deadline: deadline || null,
  };

  let created: Project;
  try {
    created = await createProject(body, domain);
  } catch (error) {
    console.error("createProjectAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the project. The server may be unavailable; please try again.",
    };
  }

  revalidatePath(`/${domain}/dashboard/projects`);
  redirect(`/${domain}/dashboard/projects/${created.nanoid}`);
}