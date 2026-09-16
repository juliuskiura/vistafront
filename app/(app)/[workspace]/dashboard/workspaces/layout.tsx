import { requireWorkspace } from "@/lib/auth/server";
import { WorkspacesShellLayout } from "./workspaces-layout";

export default async function WorkspacesLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return (
    <WorkspacesShellLayout workspaceDomain={active.domain}>
      {children}
    </WorkspacesShellLayout>
  );
}