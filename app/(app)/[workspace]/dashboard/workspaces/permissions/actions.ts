"use server";

import { revalidatePath } from "next/cache";
import { z, flattenError } from "zod";

import {
  createWorkspaceRolePermission,
  deleteWorkspaceRolePermission,
} from "@/lib/api";

export const CreatePermissionSchema = z.object({
  role: z.string().min(1, "Choose a role to grant permission to."),
  model: z
    .string()
    .trim()
    .min(1, "Model name is required.")
    .max(150, "Model name must be 150 characters or fewer."),
  mask: z.coerce
    .number()
    .int("Permission mask must be a whole number.")
    .min(0, "Permission mask cannot be negative.")
    .optional(),
});
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;

export interface PermissionActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialPermissionState: PermissionActionState = { status: "idle" };

export async function createPermissionAction(
  _prev: PermissionActionState,
  formData: FormData,
): Promise<PermissionActionState> {
  const parsed = CreatePermissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const { fieldErrors } = flattenError(parsed.error);
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const workspace = String(formData.get("workspace") ?? "").trim();
  const body = {
    role: parsed.data.role,
    model: parsed.data.model,
    ...(parsed.data.mask !== undefined ? { mask: parsed.data.mask } : {}),
  };

  try {
    await createWorkspaceRolePermission(body, workspace);
  } catch (error) {
    console.error("createPermissionAction failed:", error);
    return {
      status: "error",
      message:
        "We could not grant this permission. The rule may already exist for this role, or the server may be unavailable.",
    };
  }

  revalidatePath("/", "layout");
  return {
    status: "success",
    message: `Permission granted for "${parsed.data.model}".`,
  };
}

export async function deletePermissionAction(
  nanoid: string,
  workspace: string,
): Promise<void> {
  if (!nanoid) return;
  try {
    await deleteWorkspaceRolePermission(nanoid, workspace);
  } catch (error) {
    console.error("deletePermissionAction failed:", error);
  }
  revalidatePath("/", "layout");
}