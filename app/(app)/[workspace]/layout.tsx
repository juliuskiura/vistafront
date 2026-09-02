import { listWorkspaces, getNavigationSidebar } from "@/lib/api";
import { requireAuth, requireWorkspace } from "@/lib/auth/server";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";

/**
 * Server-side workspace guard + app shell.
 *
 * `requireWorkspace(slug)` runs first; if the signed-in user does not
 * belong to the workspace named by the URL segment, the request is
 * redirected to `/restricted` before any HTML is sent. The shell is then
 * rendered as a Client Component so the sidebar and workspace switcher
 * can react to navigation without a full page reload.
 */
export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const user = await requireAuth();
  const [allWorkspaces, nav] = await Promise.all([
    listWorkspaces().catch(() => []),
    getNavigationSidebar().catch(() => []),
  ]);

  return (
    <WorkspaceShell
      workspace={{ nanoid: active.nanoid, name: active.name, domain: active.domain }}
      workspaces={allWorkspaces.map((ws) => ({
        nanoid: ws.nanoid,
        name: ws.name,
        domain: ws.domain,
      }))}
      nav={nav}
      user={{
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      }}
    >
      {children}
    </WorkspaceShell>
  );
}
