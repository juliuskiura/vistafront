import { getTask, listWorkspaceMembers } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { TaskDetailShell } from "./task-shell";

export default async function TaskDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.tasks");

  const task = await getTask(id, active.domain);
  const members = await listWorkspaceMembers(active.nanoid, active.domain).catch(() => [] as any[]);

  let parentTask = null;
  if ((task as any).parent) {
    try {
      parentTask = await getTask((task as any).parent, active.domain);
    } catch {
      parentTask = null;
    }
  }

  const memberOptions = members.map((member: any) => ({
    nanoid: member.user_nanoid,
    name:
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.email,
  }));

  const projects = task.project
    ? [{ nanoid: task.project, name: task.project_name ?? "Project" }]
    : [];

  return (
    <TaskDetailShell
      workspaceDomain={active.domain}
      task={task}
      members={memberOptions}
      projects={projects}
      parentTask={parentTask}
    >
      {children}
    </TaskDetailShell>
  );
}
