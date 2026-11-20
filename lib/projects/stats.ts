import type { Project, Task } from "@/lib/api/types";

export interface ProjectTaskStats {
  totalTasks: number;
  doneTasks: number;
  taskCompletionRate: number;
  totalSubtasks: number;
  doneSubtasks: number;
  isOverdue: boolean;
}

export interface WorkspaceTaskStats {
  totalProjects: number;
  activeProjects: number;
  totalTasks: number;
  doneTasks: number;
  overallProgress: number;
  totalSubtasks: number;
  doneSubtasks: number;
  pendingReviewsCount: number;
}

export interface ProjectStatsBundle {
  workspace: WorkspaceTaskStats;
  byProject: Record<string, ProjectTaskStats>;
}

/**
 * Aggregate task statistics for a project list in a single pass.
 *
 * Replaces the previous O(projects × tasks) filtering done inside the
 * client component with one O(tasks + projects) traversal. The result is
 * computed on the server (see `page.tsx`) so the client component stays
 * purely presentational.
 */
export function buildProjectStats(
  projects: Project[],
  tasks: Task[],
): ProjectStatsBundle {
  const acc = new Map<
    string,
    { totalTasks: number; doneTasks: number; totalSubtasks: number; doneSubtasks: number }
  >();

  const workspace = {
    totalTasks: 0,
    doneTasks: 0,
    totalSubtasks: 0,
    doneSubtasks: 0,
    pendingReviewsCount: 0,
  };

  for (const task of tasks) {
    const isSubtask = !!task.parent;
    if (isSubtask) {
      workspace.totalSubtasks += 1;
      if (task.status === "done") workspace.doneSubtasks += 1;
    } else {
      workspace.totalTasks += 1;
      if (task.status === "done") workspace.doneTasks += 1;
      if (task.status === "review") workspace.pendingReviewsCount += 1;
    }

    if (task.project) {
      let entry = acc.get(task.project);
      if (!entry) {
        entry = { totalTasks: 0, doneTasks: 0, totalSubtasks: 0, doneSubtasks: 0 };
        acc.set(task.project, entry);
      }
      if (isSubtask) {
        entry.totalSubtasks += 1;
        if (task.status === "done") entry.doneSubtasks += 1;
      } else {
        entry.totalTasks += 1;
        if (task.status === "done") entry.doneTasks += 1;
      }
    }
  }

  const byProject: Record<string, ProjectTaskStats> = {};
  const now = new Date();
  for (const project of projects) {
    const entry = acc.get(project.nanoid) ?? {
      totalTasks: 0,
      doneTasks: 0,
      totalSubtasks: 0,
      doneSubtasks: 0,
    };
    const totalTasks = entry.totalTasks;
    const doneTasks = entry.doneTasks;
    const totalSubtasks = entry.totalSubtasks;
    const doneSubtasks = entry.doneSubtasks;
    byProject[project.nanoid] = {
      totalTasks,
      doneTasks,
      taskCompletionRate:
        totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      totalSubtasks,
      doneSubtasks,
      isOverdue:
        !!project.deadline &&
        new Date(project.deadline) < now &&
        project.status !== "completed",
    };
  }

  const overallProgress =
    workspace.totalTasks > 0
      ? Math.round((workspace.doneTasks / workspace.totalTasks) * 100)
      : 0;

  const activeProjects = projects.filter(
    (p) => p.status === "in_progress" || p.status === "planning",
  ).length;

  return {
    workspace: {
      totalProjects: projects.length,
      activeProjects,
      totalTasks: workspace.totalTasks,
      doneTasks: workspace.doneTasks,
      overallProgress,
      totalSubtasks: workspace.totalSubtasks,
      doneSubtasks: workspace.doneSubtasks,
      pendingReviewsCount: workspace.pendingReviewsCount,
    },
    byProject,
  };
}
