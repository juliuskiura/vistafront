"use server";

import { redirect } from "next/navigation";

import type { AuthActionState } from "@/lib/auth/action-state";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Server Action: register a new Vistasolve user.
 *
 * Calls Django `/apis/auth/users/`. On success the user is created in an
 * inactive state and djoser emails them an activation link; the form then
 * redirects to `/verify-email` so the UI can prompt them to check their
 * inbox. On failure, returns field-level errors from the drf-standardized
 * payload.
 */
export async function signupAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const first_name = String(formData.get("first_name") ?? "").trim();
  const last_name = String(formData.get("last_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const re_password = String(formData.get("re_password") ?? "");
  const agree_terms = formData.get("agree_terms") === "on";

  const fieldErrors: Record<string, string[]> = {};
  if (!email) fieldErrors.email = ["Email is required."];
  if (!first_name) fieldErrors.first_name = ["First name is required."];
  if (!password) fieldErrors.password = ["Password is required."];
  if (!re_password) fieldErrors.re_password = ["Please confirm your password."];
  if (password && re_password && password !== re_password) {
    fieldErrors.re_password = ["Passwords do not match."];
  }
  if (!agree_terms) {
    fieldErrors.agree_terms = ["You must agree to the terms to continue."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: "Please fix the highlighted fields.", fieldErrors };
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/apis/auth/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name,
        last_name,
        password,
        re_password,
        agree_terms,
      }),
      cache: "no-store",
    });
  } catch {
    return {
      status: "error",
      message: "We could not reach the sign-up service. Please try again.",
    };
  }

  if (!response.ok) {
    const parsed = await safeReadFieldErrors(response);
    return {
      status: "error",
      message: parsed.message,
      fieldErrors: parsed.fieldErrors,
    };
  }

  redirect("/verify-email");
}

/**
 * Server Action: resend the activation email.
 *
 * Calls Django `/apis/auth/users/resend_activation/`. To avoid leaking
 * which emails are registered, the form always shows a neutral success
 * message regardless of whether the address exists.
 */
export async function resendActivationAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return {
      status: "error",
      message: "Enter your email so we can resend the link.",
      fieldErrors: { email: ["Email is required."] },
    };
  }

  try {
    await fetch(`${BACKEND_URL}/apis/auth/users/resend_activation/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Resend activation error:", error);
  }

  return {
    status: "success",
    redirectTo: "/verify-email",
  };
}

async function safeReadFieldErrors(
  response: Response,
): Promise<{ message: string; fieldErrors: Record<string, string[]> }> {
  const fieldErrors: Record<string, string[]> = {};
  let message = "We could not create your account. Please review the fields below.";

  try {
    const data = (await response.json()) as unknown;
    if (!data || typeof data !== "object") return { message, fieldErrors };

    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.errors)) {
      for (const entry of obj.errors) {
        if (!entry || typeof entry !== "object") continue;
        const e = entry as { attr?: unknown; detail?: unknown; code?: unknown };
        const attr = typeof e.attr === "string" ? e.attr : null;
        const detail = typeof e.detail === "string" ? e.detail : null;
        if (!detail) continue;
        if (attr) {
          fieldErrors[attr] = [...(fieldErrors[attr] ?? []), detail];
        } else if (!fieldErrors._form) {
          fieldErrors._form = [detail];
          message = detail;
        }
      }
      return { message, fieldErrors };
    }

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value) && value.every((v) => typeof v === "string")) {
        fieldErrors[key] = value as string[];
      } else if (typeof value === "string") {
        fieldErrors[key] = [value];
      }
    }
  } catch {
    /* ignore */
  }

  return { message, fieldErrors };
}
