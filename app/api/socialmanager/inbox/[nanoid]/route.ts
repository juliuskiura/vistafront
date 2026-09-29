import { NextResponse, type NextRequest } from "next/server";

import { getConversation } from "@/lib/api/inbox";
import { apiErrorResponse } from "@/lib/api/route-errors";

/**
 * Client-component bridge for a single inbox thread.
 *
 * Requires the `X-Workspace` header, which `app/api/**` cannot read from
 * `params`, so the workspace comes in as a query param — the convention used
 * across the other socialmanager handlers.
 *
 * Read-through only, and never cached. Note this endpoint clears the thread's
 * unread badge server-side, which is why the client fetches it on demand when
 * a thread is opened rather than on a poll interval: a background refetch
 * would mark every thread read while the user is looking elsewhere.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nanoid: string }> },
) {
  const { nanoid } = await params;
  const workspace = request.nextUrl.searchParams.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  try {
    const conversation = await getConversation(nanoid, workspace);
    return NextResponse.json(conversation, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return await apiErrorResponse(error, { message: "Failed to load the thread." });
  }
}
