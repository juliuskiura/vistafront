import { listPlatforms } from "@/lib/api";

/**
 * Client-component bridge for the social-network picker.
 *
 * `ConnectAccountModal` needs the workspace's platform list, but it is mounted
 * by `ConnectAccountProvider` — above every Server Component fetch — so it has
 * no `platforms` prop to receive. Route Handlers run on the server, so this
 * delegates to the same `listPlatforms` wrapper the Server Components use and
 * inherits its cookie forwarding, `X-Workspace` header, 401 refresh, and
 * `unwrapAll` pagination handling.
 *
 * The workspace arrives as a query param because this route sits outside the
 * `[workspace]` segment and cannot read it from `params` — same convention as
 * `app/api/socialmanager/media/[nanoid]/route.ts`.
 */
export async function GET(request: Request) {
  const workspace = new URL(request.url).searchParams.get("workspace") ?? "";
  if (!workspace) {
    return Response.json({ error: "Missing workspace" }, { status: 400 });
  }

  try {
    const platforms = await listPlatforms({ all: true, workspace });
    return Response.json(platforms, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return Response.json({ error: "Failed to load platforms." }, { status: 502 });
  }
}
