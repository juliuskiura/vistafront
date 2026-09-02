"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth/server";
import type { AuthActionState } from "@/lib/auth/action-state";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Server Action: sign the user in.
 *
 * Calls Django's `/apis/auth/jwt/create/` endpoint. Django responds with
 * `Set-Cookie: access=...; HttpOnly` and `Set-Cookie: refresh=...; HttpOnly`.
 * In a Server Action, the response cookies from a same-origin `fetch()` are
 * not automatically forwarded to the browser, so we replay the relevant
 * attributes ourselves onto the outbound response cookies. HttpOnly is
 * preserved so client JavaScript still cannot read the token.
 *
 * Returns a state object the form can render without a thrown error. On
 * success, `redirect()` throws and the response is sent to the client.
 */
export async function loginAction(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return {
      status: "error",
      message: "Email and password are required.",
      fieldErrors: {
        ...(email ? {} : { email: ["Email is required."] }),
        ...(password ? {} : { password: ["Password is required."] }),
      },
    };
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/apis/auth/jwt/create/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return {
      status: "error",
      message: "We could not reach the sign-in service. Please try again.",
    };
  }

  if (!response.ok) {
    const detail = await safeReadDetail(response);
    return {
      status: "error",
      message: detail || "Invalid email or password.",
      fieldErrors: { email: [detail || "Invalid email or password."] },
    };
  }

  await forwardAuthCookies(response);

  const user = await getAuthUser();
  if (!user) {
    return {
      status: "error",
      message: "Signed in, but we could not load your account. Please try again.",
    };
  }

  redirect(user.redirect_url || "/onboarding");
}

/**
 * Read a `detail` field from a Django error response, falling back to a
 * flattened drf-standardized-errors payload.
 */
async function safeReadDetail(response: Response): Promise<string | null> {
  try {
    const data = (await response.json()) as unknown;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (typeof obj.detail === "string") return obj.detail;
      const errors = obj.errors;
      if (Array.isArray(errors) && errors.length > 0) {
        const first = errors[0] as { detail?: unknown; attr?: unknown };
        if (typeof first?.detail === "string") {
          return first.attr ? `${first.attr}: ${first.detail}` : first.detail;
        }
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Replay Django's `Set-Cookie` headers onto the outbound response so the
 * browser stores the HttpOnly `access` and `refresh` tokens. Only the
 * `access` and `refresh` cookies are forwarded; any other cookie Django
 * might set (e.g. CSRF) is ignored.
 *
 * Must run inside a Server Action — `.set` on `cookies()` is not allowed
 * during Server Component render.
 */
async function forwardAuthCookies(response: Response): Promise<void> {
  const setCookies = response.headers.getSetCookie();
  if (!setCookies.length) return;

  const cookieStore = await cookies();

  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split("; ");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    if (name !== "access" && name !== "refresh") continue;

    const lowerAttrs = attributes.map((a) => a.toLowerCase());
    const httpOnly = lowerAttrs.some((a) => a === "httponly");
    const secure = lowerAttrs.some((a) => a === "secure");
    const sameSiteRaw = attributes
      .find((a) => a.toLowerCase().startsWith("samesite="))
      ?.split("=")[1] as "lax" | "strict" | "none" | undefined;
    const sameSite = (sameSiteRaw ?? "lax").toLowerCase() as
      | "lax"
      | "strict"
      | "none";

    cookieStore.set(name, value, {
      httpOnly,
      secure,
      sameSite,
      path: "/",
    });
  }
}
