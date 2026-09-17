"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createWorkspaceRolePermission,
  deleteWorkspaceRolePermission,
  listWorkspaceRolePermissions,
  updateWorkspaceRolePermission,
} from "@/lib/api";

/**
 * The permission matrix sends one entry per model the admin touched: the
 * model key and its desired bitmask. A mask of `0` means "revoke" (delete the
 * row); a non-zero mask creates or updates it.
 */
export const SavePermissionsSchema = z.object({
  role: z.string().min(1, "Choose a role to update."),
  workspace: z.string().min(1, "Missing workspace."),
  changes: z.array(
    z.object({
      model: z.string().min(1),
      mask: z.number().int().min(0, "Mask cannot be negative."),
    }),
  ),
});
export type SavePermissionsInput = z.infer<typeof SavePermissionsSchema>;

export interface SavePermissionsResult {
  status: "success" | "error";
  message: string;
}

export async function saveRolePermissionsAction(
  input: SavePermissionsInput,
): Promise<SavePermissionsResult> {
  const parsed = SavePermissionsSchema.safeParse(input);
  if (!parsed.success) {
    return { status: "error", message: "Invalid permission changes." };
  }

  const { role, workspace, changes } = parsed.data;

  try {
    const existing = await listWorkspaceRolePermissions(workspace);
    const byModel = new Map(
      existing
        .filter((permission) => permission.role === role)
        .map((permission) => [permission.model, permission]),
    );

    for (const change of changes) {
      const current = byModel.get(change.model);

      if (change.mask === 0) {
        if (current) {
          await deleteWorkspaceRolePermission(current.nanoid, workspace);
        }
      } else if (current) {
        if (current.mask !== change.mask) {
          await updateWorkspaceRolePermission(
            current.nanoid,
            { mask: change.mask },
            workspace,
          );
        }
      } else {
        await createWorkspaceRolePermission(
          { role, model: change.model, mask: change.mask },
          workspace,
        );
      }
    }
  } catch (error) {
    console.error("saveRolePermissionsAction failed:", error);
    return {
      status: "error",
      message:
        "We could not save these permissions. Please check your access and try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Permissions updated." };
}
