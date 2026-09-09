import { NextRequest, NextResponse } from "next/server";
import { listWorkspaces } from "@/lib/api";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

function authCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

function destinationFor(req: NextRequest): string {
  const nextUrl = req.cookies.get("auth_next_url")?.value;
  return nextUrl && nextUrl.startsWith("/") && !nextUrl.startsWith("//")
    ? nextUrl
    : "/dashboard";
}

async function isValidWorkspaceDestination(destination: string): Promise<boolean> {
  const pathSegment = destination.split("/").filter(Boolean)[0]?.toLowerCase();
  if (!pathSegment) return true; // Non-workspace paths are always valid
  try {
    const workspaces = await listWorkspaces();
    return workspaces.some((ws) => ws.domain.toLowerCase() === pathSegment);
  } catch {
    return false;
  }
}

/**
 * GET /api/auth/check
 *
 * Loop-breaker + session validator. The proxy cannot call Django (edge
 * middleware, no backend env), so it derives intent from cookie *presence*.
 * That is safe for gating unauthenticated users, but dangerous in reverse:
 * a stale/blacklisted/expired `access` cookie makes the proxy think the user
 * is signed in and bounce them toward /dashboard, which fails, redirects back
 * to /login, and loops forever.
 *
 * This Route Handler runs on Node where the backend env is available and where
 * cookies CAN be set (allowed in Route Handlers, unlike Server Component
 * render). It:
 *   1. Verifies the access token against Django, silently refreshing if 401.
 *   2. Valid → 307 to the captured auth_next_url (or /dashboard).
 *   3. Invalid → clears the stale cookies and 307 to /login.
 *
 * Because it clears cookies on death, the next proxy pass sees a genuinely
 * logged-out user and lets /login render — the loop terminates.
 */
export async function GET(req: NextRequest) {
  const access = req.cookies.get("access")?.value;
  const refresh = req.cookies.get("refresh")?.value;
  const destination = destinationFor(req);

  // Verify an access token against Django. Returns the token string to use,
  // or null if the provided token is not usable.
  async function verify(token: string): Promise<boolean> {
    try {
      const me = await fetch(`${BACKEND_URL}/apis/auth/users/me/`, {
        headers: { Cookie: `access=${token}` },
        cache: "no-store",
      });
      return me.ok;
    } catch {
      return false;
    }
  }

  // 1. Access token present → verify it against Django.
  if (access && (await verify(access))) {
    const validDestination = await isValidWorkspaceDestination(destination);
    const redirectUrl = validDestination ? destination : "/dashboard";
    const res = NextResponse.redirect(new URL(redirectUrl, req.url));
    res.cookies.delete("auth_next_url");
    return res;
  }

  // 2. Access missing or invalid → try to refresh with the refresh cookie.
  if (refresh) {
    try {
      const rf = await fetch(`${BACKEND_URL}/apis/auth/jwt/refresh/`, {
        method: "POST",
        headers: {
          Cookie: `refresh=${refresh}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (rf.ok) {
        const data = (await rf.json().catch(() => null)) as {
          access?: string;
        } | null;

        // Token from the JSON body (normal SimpleJWT refresh), or from the
        // rotated Set-Cookie headers when Django answers 204 (bodyless).
        let newAccess = data?.access;
        const rotated: Array<{ name: string; value: string }> = [];
        if (!newAccess) {
          for (const raw of rf.headers.getSetCookie()) {
            const [pair] = raw.split("; ");
            const eq = pair.indexOf("=");
            if (eq <= 0) continue;
            const name = pair.slice(0, eq);
            if (name !== "access" && name !== "refresh") continue;
            const value = pair.slice(eq + 1);
            if (name === "access") newAccess = value;
            rotated.push({ name, value });
          }
        }

        if (newAccess) {
          // Re-validate the FRESH token before trusting the session. This
          // breaks the loop for blacklisted/banned accounts whose refresh
          // token is still technically valid: they get logged out instead of
          // ping-ponging between /dashboard and /login forever.
          if (await verify(newAccess)) {
            const validDestination = await isValidWorkspaceDestination(destination);
            const redirectUrl = validDestination ? destination : "/dashboard";
            const res = NextResponse.redirect(
              new URL(redirectUrl, req.url),
            );
            res.cookies.delete("auth_next_url");
            res.cookies.set("access", newAccess, authCookieOptions());
            for (const { name, value } of rotated) {
              res.cookies.set(name, value, authCookieOptions());
            }
            return res;
          }
        }
      }
    } catch {
      // Refresh also failed — treated as a dead session below.
    }
  }

  // 3. Session is dead — clear the stale cookies so the proxy stops
  //    treating the user as authenticated, then go to /login.
  const res = NextResponse.redirect(new URL("/login", req.url));
  res.cookies.delete("access");
  res.cookies.delete("refresh");
  res.cookies.delete("auth_next_url");
  return res;
}
