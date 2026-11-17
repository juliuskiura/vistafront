import { getProject } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { ProjectDetailShell } from "./project-shell";

export default async function ProjectDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  const project = await getProject(id, active.domain);

  return (
    <ProjectDetailShell
      workspaceDomain={active.domain}
      project={project}
    >
      {children}
    </ProjectDetailShell>
  );
}
