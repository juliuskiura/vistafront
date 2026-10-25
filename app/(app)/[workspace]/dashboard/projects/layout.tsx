import { requireWorkspace } from "@/lib/auth/server";
import { ProjectsLayout } from "./projects-shell";

export default async function ProjectsLayoutServer({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  return <ProjectsLayout workspaceDomain={active.domain}>{children}</ProjectsLayout>;
}
