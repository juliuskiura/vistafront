"use server";

import { z, flattenError } from "zod";

import {
  createProjectCategory,
  updateProjectCategory,
  deleteProjectCategory,
} from "@/lib/api/projectmanager/project-categories";
import { revalidatePath } from "next/cache";

export const CreateCategorySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  name: z.string().trim().min(1, "Name is required.").max(100),
  key: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  position: z.coerce.number().int().min(0).default(0),
});
export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

export const UpdateCategorySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing category."),
  name: z.string().trim().min(1, "Name is required.").max(100),
  key: z.string().trim().max(50).optional().or(z.literal("")),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  color: z.string().trim().max(20).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  position: z.coerce.number().int().min(0).default(0),
});
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>;

export const DeleteCategorySchema = z.object({
  workspace_domain: z.string().min(1, "Missing workspace."),
  nanoid: z.string().min(1, "Missing category."),
});
export type DeleteCategoryInput = z.infer<typeof DeleteCategorySchema>;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Server Action: create a project category.
 */
export async function createCategoryAction(
  _prev: { status: string; message: string; fieldErrors?: Record<string, string[]> },
  formData: FormData,
): Promise<{ status: string; message: string; fieldErrors?: Record<string, string[]> }> {
  const parsed = CreateCategorySchema.safeParse({
    workspace_domain: formData.get("workspace_domain"),
    name: formData.get("name"),
    key: formData.get("key"),
    description: formData.get("description"),
    color: formData.get("color"),
    is_active: formData.get("is_active") === "on",
    position: formData.get("position"),
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const key = data.key || slugify(data.name);

  try {
    await createProjectCategory(
      {
        name: data.name,
        key,
        description: data.description || undefined,
        color: data.color || undefined,
        is_active: data.is_active,
        position: data.position,
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("createCategoryAction failed:", error);
    return {
      status: "error",
      message: "We could not create the category. Please try again.",
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects/categories`);
  return { status: "success", message: `Category "${data.name}" created.` };
}

/**
 * Server Action: update a project category.
 */
export async function updateCategoryAction(
  _prev: { status: string; message: string; fieldErrors?: Record<string, string[]> },
  formData: FormData,
): Promise<{ status: string; message: string; fieldErrors?: Record<string, string[]> }> {
  const parsed = UpdateCategorySchema.safeParse({
    workspace_domain: formData.get("workspace_domain"),
    nanoid: formData.get("nanoid"),
    name: formData.get("name"),
    key: formData.get("key"),
    description: formData.get("description"),
    color: formData.get("color"),
    is_active: formData.get("is_active") === "on",
    position: formData.get("position"),
  });

  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const data = parsed.data;
  const key = data.key || slugify(data.name);

  try {
    await updateProjectCategory(
      data.nanoid,
      {
        name: data.name,
        key,
        description: data.description || undefined,
        color: data.color || undefined,
        is_active: data.is_active,
        position: data.position,
      },
      data.workspace_domain,
    );
  } catch (error) {
    console.error("updateCategoryAction failed:", error);
    return {
      status: "error",
      message: "We could not save the category. Please try again.",
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects/categories`);
  return { status: "success", message: `Category "${data.name}" saved.` };
}

/**
 * Server Action: delete a project category.
 */
export async function deleteCategoryAction(
  _prev: { status: string; message: string },
  formData: FormData,
): Promise<{ status: string; message: string }> {
  const parsed = DeleteCategorySchema.safeParse({
    workspace_domain: formData.get("workspace_domain"),
    nanoid: formData.get("nanoid"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Missing category or workspace.",
    };
  }

  const data = parsed.data;

  try {
    await deleteProjectCategory(data.nanoid, data.workspace_domain);
  } catch (error) {
    console.error("deleteCategoryAction failed:", error);
    return {
      status: "error",
      message: "We could not delete the category. Please try again.",
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects/categories`);
  return { status: "success", message: "Category deleted." };
}
