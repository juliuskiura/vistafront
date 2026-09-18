"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import { createWorkspaceRole, deleteWorkspaceRole } from "@/lib/api";

const CreateRoleSchema = z.object({
  workspace: z.string().min(1, "Missing workspace. Refresh and try again."),
  name: z
    .string()
    .trim()
    .min(1, "Role name is required.")
    .max(100, "Role name must be 100 characters or fewer."),
});
type CreateRoleInput = z.infer<typeof CreateRoleSchema>;

import { RoleActionState } from "./role-state";

export async function createRoleAction(
  _prev: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const parsed = CreateRoleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await createWorkspaceRole(parsed.data, parsed.data.workspace);
  } catch (error) {
    console.error("createRoleAction failed:", error);
    return {
      status: "error",
      message:
        "We could not create the role. The name may already exist in this workspace, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: `Role "${parsed.data.name}" created.`,
  };
}

export async function deleteRoleAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  if (!nanoid) return;
  try {
    await deleteWorkspaceRole(nanoid, workspace);
  } catch (error) {
    console.error("deleteRoleAction failed:", error);
  }
  revalidatePath("/", "layout");
}