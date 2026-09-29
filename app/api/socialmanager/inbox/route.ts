import { NextResponse } from "next/server";

import { listConversations } from "@/lib/api/inbox";
import { apiErrorResponse } from "@/lib/api/route-errors";

/**
 * Client-component bridge for the inbox thread list.
 *
 * The thread list is polled, so it needs a client-reachable endpoint, but
 * `/apis/socialmanager/inbox/` is tenant-scoped and requires the
 * `X-Workspace` header. This handler runs on the server and delegates to the
 * same `listConversations` wrapper the Server Components use, inheriting its
 * cookie forwarding and workspace header.
 *
 * The workspace arrives as a query param because `app/api/**` sits outside the
 * `[workspace]` segment and cannot read it from `params` — the same convention
 * as `app/api/socialmanager/platforms/route.ts`.
 *
 * Safe to poll: unlike the thread-detail endpoint, this one is read-only.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const workspace = params.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  try {
    const conversations = await listConversations({
      workspace,
      unread: params.get("unread") === "1",
    });
    return NextResponse.json(conversations, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return await apiErrorResponse(error, { message: "Failed to load the inbox." });
  }
}
