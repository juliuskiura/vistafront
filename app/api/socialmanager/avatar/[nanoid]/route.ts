import { cookies } from "next/headers";

// The Django base hands us a 302 to a signed CDN link. This handler relays that
// redirect rather than the bytes: proxying the image would put every avatar
// through the Next server for no gain, and following it here would mean the
// browser never learns the real link it is allowed to cache.
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/api\/socialmanager\/avatar\/([^\/]+)/);
  const nanoid = match ? decodeURIComponent(match[1]) : "";
  const workspace = url.searchParams.get("workspace") ?? "";

  if (!nanoid || !workspace) {
    return new Response(
      JSON.stringify({ error: "Missing nanoid or workspace", nanoid, workspace }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access");
    const refreshToken = cookieStore.get("refresh");

    const headers: HeadersInit = {};
    const cookieHeader = [
      accessToken ? `access=${accessToken.value}` : null,
      refreshToken ? `refresh=${refreshToken.value}` : null,
    ]
      .filter(Boolean)
      .join("; ");
    if (cookieHeader) headers.Cookie = cookieHeader;
    headers["X-Workspace"] = workspace;

    // `manual` is the whole point: the default `follow` would make this server
    // fetch the image from Meta and return its bytes, which is both slower and
    // a place for a stale link to hide.
    const response = await fetch(
      `${BACKEND_URL}/apis/socialmanager/pages/${encodeURIComponent(nanoid)}/avatar/`,
      { headers, cache: "no-store", redirect: "manual" },
    );

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("Location");
      if (!location) {
        return new Response(JSON.stringify({ error: "Avatar redirect without a target" }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(null, {
        status: 302,
        headers: {
          Location: location,
          "Cache-Control": response.headers.get("Cache-Control") ?? "private, max-age=3600",
        },
      });
    }

    // 404 means the channel genuinely has no picture. An `<img>` cannot read a
    // body, so the browser shows a broken image and the caller's `onError`
    // falls back to initials — the status is preserved either way.
    return new Response(JSON.stringify({ error: `Avatar fetch failed: ${response.status}` }), {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
