import { getProject, listTasks, listWorkspaceMembers, listNoteTypes } from "@/lib/api";
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
  const [members, tasks, noteTypes] = await Promise.all([
    listWorkspaceMembers(active.nanoid, active.domain).catch(() => []),
    listTasks({ project: project.nanoid, workspace: active.domain }).catch(
      () => [],
    ),
    listNoteTypes(active.domain).catch(() => []),
  ]);

  const memberOptions = members.map((member: any) => ({
    nanoid: member.user_nanoid,
    name:
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.email,
  }));

  return (
    <ProjectDetailShell
      workspaceDomain={active.domain}
      project={project}
      tasks={tasks}
      members={memberOptions}
      noteTypes={noteTypes}
    >
      {children}
    </ProjectDetailShell>
  );
}
