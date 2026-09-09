"use server";

import { revalidatePath } from "next/cache";

import { changePassword } from "@/lib/api/auth";

export interface AccountActionState {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export const initialAccountState: AccountActionState = { status: "idle" };

function pickString(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * Server Action: change the signed-in user's password.
 */
export async function changePasswordAction(
  _prev: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const currentPassword = pickString(formData, "current_password");
  const newPassword = pickString(formData, "new_password");

  const fieldErrors: Record<string, string[]> = {};
  if (!currentPassword) {
    fieldErrors.current_password = ["Current password is required."];
  }
  if (!newPassword) {
    fieldErrors.new_password = ["New password is required."];
  } else if (newPassword.length < 8) {
    fieldErrors.new_password = ["Password must be at least 8 characters."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  try {
    await changePassword({
      current_password: currentPassword,
      new_password: newPassword,
    });
  } catch (error) {
    console.error("changePasswordAction failed:", error);
    return {
      status: "error",
      message:
        "We could not change your password. Please check and try again.",
    };
  }

  revalidatePath("/", "layout");
  return { status: "success", message: "Your password has been changed." };
}
