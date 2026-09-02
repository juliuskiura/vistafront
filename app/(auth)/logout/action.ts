"use server";

import { redirect } from "next/navigation";

import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
} from "@/lib/auth/cookies";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * Server Action: log the current user out.
 *
 * Best-effort: calls Django `/apis/auth/jwt/logout/` to blacklist the
 * refresh token, then unconditionally clears the auth cookies and
 * redirects to `/login`. The `redirect()` call throws, which is how a
 * Server Action signals success-with-navigation to the client.
 */
export async function logoutAction(): Promise<void> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/apis/auth/jwt/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: [
            accessToken ? `access=${accessToken}` : null,
            `refresh=${refreshToken}`,
          ]
            .filter(Boolean)
            .join("; "),
        },
        cache: "no-store",
      });
    } catch (error) {
      // Even if the backend is unreachable, we still want to clear local
      // cookies and bounce the user to the login page.
      console.error("Logout error:", error);
    }
  }

  await clearAuthCookies();
  redirect("/login");
}
