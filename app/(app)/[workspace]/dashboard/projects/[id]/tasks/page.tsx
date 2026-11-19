import Link from "next/link";

import {
  getProject,
  listTasks,
  listWorkspaceMembers,
  type Project,
  type Task,
  type WorkspaceMember,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { Banner } from "@/components/banner";
import { ProjectRecord } from "../project-record";

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  let project: Project;
  try {
    project = await getProject(id, active.domain);
  } catch (error) {
    console.error("ProjectTasksPage: could not load project", error);
    return (
      <div className="max-w-3xl space-y-4">
        <Link
          href={`/${active.domain}/dashboard/projects`}
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back to projects
        </Link>
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          We couldn&apos;t load this project. It may have been removed or you may
          no longer have access.
        </div>
      </div>
    );
  }

  const [members, tasks] = await Promise.all([
    listWorkspaceMembers(active.nanoid, active.domain).catch(
      () => [] as WorkspaceMember[],
    ),
    listTasks({ project: project.nanoid, workspace: active.domain }).catch(
      () => [] as Task[],
    ),
  ]);

  const memberOptions = members.map((member) => ({
    nanoid: member.user_nanoid,
    name:
      [member.first_name, member.last_name].filter(Boolean).join(" ") ||
      member.email,
  }));

  const projectOptions = [
    { nanoid: project.nanoid, name: project.name },
  ];

  return (
    <div className="flex-1">
      <ProjectRecord
        project={project}
        workspaceDomain={active.domain}
        activeTab="tasks"
        tasks={tasks}
        members={memberOptions}
        projectOptions={projectOptions}
      />
    </div>
  );
}
