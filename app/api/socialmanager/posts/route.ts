import { NextResponse } from "next/server";

import { listPostsPage } from "@/lib/api/socialmanager";
import { apiErrorResponse } from "@/lib/api/route-errors";

/** Posts per feed page. Django caps `page_size` at 100; 25 matches the inbox. */
const DEFAULT_PAGE_SIZE = 25;

/**
 * Client-component bridge for the Unified Feed's post pages.
 *
 * The feed pages through the workspace's published posts, and a Client
 * Component cannot call `serverFetch` (it is `"use server"`), so this handler
 * runs on the server and delegates to the same `listPostsPage` wrapper the
 * Server Components use — inheriting its httpOnly cookie forwarding and its
 * `X-Workspace` header, which Django needs to resolve the tenant at all
 * (without it every list answers `200` with an empty page).
 *
 * The workspace arrives as a query param because `app/api/**` sits outside the
 * `[workspace]` segment and cannot read it from `params` — the same convention
 * as `app/api/socialmanager/inbox/route.ts`.
 *
 * Read-only, so it is safe to refetch on window focus.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const workspace = params.get("workspace") ?? "";
  if (!workspace) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  const page = Number.parseInt(params.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(params.get("page_size") ?? "", 10);

  try {
    const posts = await listPostsPage({
      workspace,
      // Passed through rather than defaulted here: the status the feed wants
      // (published by default) is decided in one place, the feed's own filter
      // module, so the server prefetch and the client refetch cannot disagree.
      status: params.get("status") ?? undefined,
      managed_page: params.get("managed_page") ?? undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : DEFAULT_PAGE_SIZE,
    });
    return NextResponse.json(posts, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return await apiErrorResponse(error, { message: "Failed to load the feed." });
  }
}
