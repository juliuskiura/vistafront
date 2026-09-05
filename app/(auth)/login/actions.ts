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

  // If the user was redirected here while trying to reach a protected page,
  // send them back there instead of the onboarding default.
  const cookieStore = await cookies();
  const nextUrl = cookieStore.get("auth_next_url")?.value;

  if (nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")) {
    cookieStore.delete("auth_next_url");
    redirect(nextUrl);
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
 * browser stores the HttpOnly `access` and `refresh` tokens, plus the
 * `csrftoken` cookie that Django's CsrfViewMiddleware sets on every response.
 *
 * In the legacy SPA, Django's cookies reached the browser directly because
 * requests went through Vite's same-origin proxy.  In Next.js, login calls
 * Django server-side (Node→Node), so the browser never sees Django's
 * Set-Cookie headers — we must forward them manually.
 *
 * The CSRF cookie is NOT HttpOnly (JavaScript must read it to attach the
 * X-CSRFToken header on mutations).
 *
 * Must run inside a Server Action — `.set` on `cookies()` is not allowed
 * during Server Component render.
 */
async function forwardAuthCookies(response: Response): Promise<void> {
  const setCookies = response.headers.getSetCookie();
  if (!setCookies.length) return;

  const cookieStore = await cookies();
  const forwarded = new Set<string>();

  for (const raw of setCookies) {
    const [pair, ...attributes] = raw.split("; ");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);

    // Forward auth tokens and the CSRF cookie.  Skip anything else
    // (sessionid, etc.) that we don't need in the browser.
    const isAuth = name === "access" || name === "refresh";
    const isCsrf = name === "csrftoken";
    if (!isAuth && !isCsrf) continue;

    // Deduplicate — Django may send multiple Set-Cookie for the same name.
    if (forwarded.has(name)) continue;
    forwarded.add(name);

    const lowerAttrs = attributes.map((a) => a.toLowerCase());
    const secure = lowerAttrs.some((a) => a === "secure");
    const sameSiteRaw = attributes
      .find((a) => a.toLowerCase().startsWith("samesite="))
      ?.split("=")[1] as "lax" | "strict" | "none" | undefined;
    const sameSite = (sameSiteRaw ?? "lax").toLowerCase() as
      | "lax"
      | "strict"
      | "none";

    // Auth cookies stay HttpOnly; the CSRF cookie must be readable by JS
    // so the upload manager and mutation helpers can attach X-CSRFToken.
    const httpOnly = isAuth
      ? lowerAttrs.some((a) => a === "httponly")
      : false;

    cookieStore.set(name, value, {
      httpOnly,
      secure,
      sameSite,
      path: "/",
    });
  }
}
