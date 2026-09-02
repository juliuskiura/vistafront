"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export type ActivationResult = {
  status: "ok" | "error";
  message: string;
};

/**
 * Server Action: activate an account from an email link and log the user in.
 *
 * Calls `/apis/auth/activate-and-login/`. Django activates the user and
 * issues HttpOnly `access` / `refresh` cookies via `Set-Cookie`. We replay
 * those cookies on the outbound response so the user is immediately signed
 * in after the link click. On success, `redirect()` throws.
 */
export async function activateAndLoginAction(
  _prev: ActivationResult,
  formData: FormData,
): Promise<ActivationResult> {
  const uid = String(formData.get("uid") ?? "").trim();
  const token = String(formData.get("token") ?? "").trim();

  if (!uid || !token) {
    return { status: "error", message: "This activation link is missing required information." };
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/apis/auth/activate-and-login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, token }),
      cache: "no-store",
    });
  } catch {
    return { status: "error", message: "We could not reach the activation service." };
  }

  if (!response.ok) {
    return {
      status: "error",
      message: "This activation link is invalid or has expired. Please request a new one.",
    };
  }

  const setCookies = response.headers.getSetCookie();
  const cookieStore = await cookies();
  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split("; ");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    if (name !== "access" && name !== "refresh") continue;
    const lower = attributes.map((a) => a.toLowerCase());
    cookieStore.set(name, value, {
      httpOnly: lower.some((a) => a === "httponly"),
      secure: lower.some((a) => a === "secure"),
      sameSite: (attributes
        .find((a) => a.toLowerCase().startsWith("samesite="))
        ?.split("=")[1] ?? "lax") as "lax" | "strict" | "none",
      path: "/",
    });
  }

  const user = await getAuthUser();
  redirect(user?.redirect_url || "/onboarding");
}
