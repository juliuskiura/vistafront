"use server";

import type { AuthActionState } from "@/lib/auth/action-state";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Server Action: request a password-reset email.
 *
 * Calls Django `/apis/auth/users/reset_password/`. To avoid leaking which
 * emails are registered, the form always shows the same neutral success
 * message.
 */
export async function requestPasswordResetAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return {
      status: "error",
      message: "Enter the email you use to sign in.",
      fieldErrors: { email: ["Email is required."] },
    };
  }

  try {
    await fetch(`${BACKEND_URL}/apis/auth/users/reset_password/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
  }

  return {
    status: "success",
    redirectTo: "/password/reset?sent=1",
  };
}
