"use server";

import { redirect } from "next/navigation";

import type { AuthActionState } from "@/lib/auth/action-state";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Server Action: confirm a password reset from an email link.
 *
 * Calls Django `/apis/auth/users/reset_password_confirm/`. On success the
 * user is bounced to `/login` with `?reset=1` so the UI can show a
 * confirmation.
 */
export async function confirmPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const uid = String(formData.get("uid") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();
  const new_password = String(formData.get("new_password") ?? "");
  const re_new_password = String(formData.get("re_new_password") ?? "");

  const fieldErrors: Record<string, string[]> = {};
  if (!new_password) fieldErrors.new_password = ["Enter a new password."];
  if (new_password && new_password.length < 8) {
    fieldErrors.new_password = ["Password must be at least 8 characters."];
  }
  if (new_password !== re_new_password) {
    fieldErrors.re_new_password = ["Passwords do not match."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  let response: Response;
  try {
    response = await fetch(
      `${BACKEND_URL}/apis/auth/users/reset_password_confirm/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid, token, new_password, re_new_password }),
        cache: "no-store",
      },
    );
  } catch {
    return {
      status: "error",
      message: "We could not reach the password service. Please try again.",
    };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: "This reset link is invalid or has expired. Please request a new one.",
    };
  }

  redirect("/login?reset=1");
}
