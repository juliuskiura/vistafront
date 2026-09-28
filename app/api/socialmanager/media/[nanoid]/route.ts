import { cookies } from "next/headers";

import {
  SESSION_EXPIRED_HEADER,
  SESSION_EXPIRED_VALUE,
} from "@/lib/api/session-expired";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const match = pathname.match(/\/api\/socialmanager\/media\/([^\/]+)/);
  const nanoid = match ? match[1] : "";
  const workspace = url.searchParams.get("workspace") ?? "";

  if (!nanoid || !workspace) {
    return new Response(
      JSON.stringify({ error: "Missing nanoid or workspace", pathname, nanoid, workspace }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
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

    const response = await fetch(
      `${BACKEND_URL}/apis/socialmanager/posts/${encodeURIComponent(nanoid)}/media/`,
      {
        headers,
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      // `<img src>` cannot run our client wrapper, so there is nothing to
      // recover on this path — but the header is still worth stamping so the
      // response is self-describing for any future fetch-based caller.
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (response.status === 401) {
        headers[SESSION_EXPIRED_HEADER] = SESSION_EXPIRED_VALUE;
      }
      return new Response(
        JSON.stringify({ error: `Media fetch failed: ${response.status}`, details: errorText }),
        {
          status: response.status,
          headers,
        },
      );
    }

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
