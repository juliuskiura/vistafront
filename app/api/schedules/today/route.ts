import { NextResponse } from "next/server";

import { serverFetch } from "@/lib/api/server-fetch";

/**
 * Route Handler — proxies `/apis/schedules/today/` from Django to the
 * client. Used by TanStack Query `useQuery` on the Client island side.
 *
 * The Django endpoint needs the `X-Workspace` header; we read it from
 * the incoming request's `?workspace=` query param (added by the Client
 * island from its props) and forward it as a header. Server Components
 * call `getTodaySummary(workspace)` directly via `serverFetch` and do
 * not go through this handler.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspace = url.searchParams.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json(
      { error: "Missing ?workspace=" },
      { status: 400 },
    );
  }
  try {
    const data = await serverFetch("/apis/schedules/today/", { workspace });
    return NextResponse.json(data, {
      headers: {
        // Tell the CDN / browser this is per-tenant — never cache.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}