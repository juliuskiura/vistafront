import { listAllProjects } from "@/lib/api";
import type { Project } from "@/lib/api/types";
import { listProjectCategories } from "@/lib/api/projectmanager";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";
import { ProjectsList } from "./projects-list";
import { getProjectStats } from "@/lib/api/projectmanager/projects";

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "projectmanager.projects");

  const [{ projects: summaries, total, truncated }, stats, categories] =
    await Promise.all([
      listAllProjects({ workspace: active.domain }),
      getProjectStats(active.domain),
      listProjectCategories(active.domain).catch(() => []),
    ]);

  const projects = summaries.map((p) => ({
    ...p,
    description: "",
    start_date: null,
    updated_at: p.created_at,
  })) as Project[];

  const workspaceStats = {
    totalProjects: stats.workspace.total_projects,
    activeProjects: stats.workspace.active_projects,
    totalTasks: stats.workspace.total_tasks,
    doneTasks: stats.workspace.completed_tasks,
    overallProgress: stats.workspace.overall_progress,
    totalSubtasks: stats.workspace.total_subtasks,
    doneSubtasks: stats.workspace.completed_subtasks,
    pendingReviewsCount: stats.workspace.pending_reviews,
  };

  const projectStats = Object.fromEntries(
    Object.entries(stats.projects).map(([key, value]) => [
      key,
      {
        totalTasks: value.top_level_tasks,
        doneTasks: value.completed_top_level_tasks,
        taskCompletionRate: value.top_level_completion_rate,
        totalSubtasks: value.subtasks,
        doneSubtasks: value.completed_subtasks,
        isOverdue: value.is_overdue,
      },
    ]),
  );

  return (
    <div className="flex-1">
      <ProjectsList
        projects={projects}
        categories={categories}
        workspaceDomain={active.domain}
        total={total}
        truncated={truncated}
        workspaceStats={workspaceStats}
        projectStats={projectStats}
      />
    </div>
  );
}
