import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

/**
 * GET /api/csrf — fetch the CSRF token from Django and set it as a browser
 * cookie so client-side XHR/fetch calls can attach X-CSRFToken.
 *
 * Django's CsrfViewMiddleware sets the csrftoken cookie on every response,
 * but in Next.js the initial page load never touches Django from the browser
 * (Server Components fetch server-side). This route bridges that gap.
 */
export async function GET() {
  const cookieStore = await cookies();
  const access = cookieStore.get("access")?.value;
  const refresh = cookieStore.get("refresh")?.value;

  const cookieHeader = [
    access ? `access=${access}` : null,
    refresh ? `refresh=${refresh}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  const headers: Record<string, string> = {};
  if (cookieHeader) headers.Cookie = cookieHeader;

  const res = await fetch(`${BACKEND_URL}/apis/users/csrf/`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(
      { detail: "Failed to fetch CSRF token" },
      { status: res.status },
    );
  }

  // Replay Django's Set-Cookie headers onto the browser response so the
  // csrftoken cookie is set on the Next.js origin (localhost:3000 in dev).
  const out = NextResponse.json({ detail: "CSRF cookie set" });
  for (const raw of res.headers.getSetCookie()) {
    const [pair, ...attrs] = raw.split("; ");
    const eq = pair.indexOf("=");
    if (eq <= 0) continue;
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);

    const lower = attrs.map((a) => a.toLowerCase());
    const secure = lower.some((a) => a === "secure");
    const sameSiteRaw = attrs
      .find((a) => a.toLowerCase().startsWith("samesite="))
      ?.split("=")[1];
    const sameSite = (sameSiteRaw ?? "lax").toLowerCase() as
      | "lax"
      | "strict"
      | "none";

    out.cookies.set(name, value, {
      path: "/",
      httpOnly: false,   // JS must read csrftoken for X-CSRFToken header
      secure,
      sameSite,
    });
  }

  return out;
}
