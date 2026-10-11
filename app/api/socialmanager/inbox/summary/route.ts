import { NextResponse } from "next/server";

import { getInboxSummary } from "@/lib/api/inbox";
import { apiErrorResponse } from "@/lib/api/route-errors";

/**
 * Client-component bridge for the inbox unread summary.
 *
 * The section nav polls this so "Unified Inbox" can wear an unread badge even
 * when the user is on another Social Manager tab. The summary is a set of
 * counts rather than a page of threads, so — unlike the thread-detail handler —
 * it is cheap and read-only enough to sit on a refetch interval.
 *
 * The workspace arrives as a query param because `app/api/**` sits outside the
 * `[workspace]` segment and cannot read it from `params` — the same convention
 * as the sibling inbox handlers.
 */
export async function GET(request: Request) {
  const workspace = new URL(request.url).searchParams.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  try {
    const summary = await getInboxSummary(workspace);
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return await apiErrorResponse(error, {
      message: "Failed to load the inbox summary.",
    });
  }
}
