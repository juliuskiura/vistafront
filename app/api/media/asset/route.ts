import { NextResponse } from "next/server";

import { serverFetch } from "@/lib/api/server-fetch";

/**
 * Route Handler — proxies the media asset fetch to the client.
 *
 * Used by the video player to refresh a presigned `stream_url` when it
 * expires (legacy equivalent of RTK Query `refetch()`). The Django
 * endpoint needs `X-Workspace`; we read it from the incoming
 * `?workspace=` query param and forward it as a header, while cookies
 * are forwarded automatically by `serverFetch`.
 *
 * Two behavior guarantees the legacy `refetch()` provided and that
 * prevent the player from freezing while "Reconnecting…":
 *   1. Always returns a fresh JSON object (even if the URL is unchanged)
 *      so the client can re-init the <video> element.
 *   2. `Cache-Control: no-store` so we never get a stale presigned URL.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const nanoid = url.searchParams.get("nanoid") ?? "";
  const workspace = url.searchParams.get("workspace") ?? "";
  if (!nanoid || !workspace) {
    return NextResponse.json(
      { error: "Missing ?nanoid= or ?workspace=" },
      { status: 400 },
    );
  }
  try {
    const data = await serverFetch(`/apis/media/assets/${nanoid}/`, {
      workspace,
    });
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Server fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
