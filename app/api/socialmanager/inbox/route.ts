import { NextResponse } from "next/server";

import {
  listConversationsWithChannels,
  type ConversationChannel,
} from "@/lib/api/inbox";
import { listPages } from "@/lib/api/socialmanager";
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
 *
 * Channels are resolved here rather than in the browser because the list
 * serializer denormalises only a preview — it never joins the page table, so a
 * row carries no channel of its own. Attributing one needs a request per
 * connected channel (the endpoint's existing `?page=` filter), and doing that
 * from the client would fan every 30-second poll out over the user's network
 * instead of the server's.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const workspace = params.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  try {
    // A workspace whose channels cannot be listed still gets its inbox: the
    // thread rows are what the agent needs, and the channel badge is additive.
    const channels = await listConnectedChannels(workspace);

    const conversations = await listConversationsWithChannels({
      workspace,
      unread: params.get("unread") === "1",
      channels,
    });
    return NextResponse.json(conversations, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return await apiErrorResponse(error, { message: "Failed to load the inbox." });
  }
}

/**
 * The workspace's connected channels, in the shape an inbox row needs.
 *
 * Only channels that can actually receive messages are returned: a page whose
 * platform has no messaging provider would resolve to zero threads, so asking
 * for its window is a wasted request on every poll.
 *
 * `platform` is the *door* — `instagramfb` for a channel connected through a
 * Facebook Page — which is what `PlatformGlyph` resolves to a brand, so such a
 * channel wears the Instagram icon rather than an unbranded text badge.
 */
async function listConnectedChannels(
  workspace: string,
): Promise<ConversationChannel[]> {
  const pages = await listPages({ workspace }).catch(() => []);
  return pages
    .filter((page) => page.is_active)
    .map((page) => ({
      nanoid: page.nanoid,
      page_name: page.page_name || page.username || page.account_name,
      platform_slug: page.platform || "",
    }));
}
