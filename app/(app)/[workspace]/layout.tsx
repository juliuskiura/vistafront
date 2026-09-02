import { requireWorkspace } from "@/lib/auth/server";

/**
 * Server-side workspace guard for the `[workspace]` segment.
 *
 * `requireWorkspace(slug)` calls the backend to confirm the signed-in user
 * belongs to the workspace identified by the URL slug. If the slug is empty
 * or does not match any workspace the user belongs to, it redirects to
 * `/restricted` (or `/login` when the user is not signed in). Otherwise the
 * child routes render.
 *
 * Because this runs on the server, authorization is decided before any page
 * HTML is sent to the browser.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace } = await params;
  await requireWorkspace(workspace);

  return <>{children}</>;
}
