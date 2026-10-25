"use client";

import type { Project, Task } from "@/lib/api";
import { ProjectHeader } from "./_components/project-header";
import { ProjectTabs } from "./_components/project-tabs";
import { OverviewTab } from "./_components/overview-tab";
import { TasksTab } from "./_components/tasks-tab";
import type { PickerOption } from "../forms/project-form";

interface Props {
  project: Project;
  workspaceDomain: string;
  activeTab: string;
  tasks: Task[];
  members: PickerOption[];
  companies: PickerOption[];
  clients: PickerOption[];
  /** The current project, as a single-option picker for the task form. */
  projectOptions: PickerOption[];
}

/**
 * The project record shell.
 *
 * Owns the tab strip and the record body. The server component supplies the
 * project and the per-tab data; this component decides what to show.
 */
export function ProjectRecord({
  project,
  workspaceDomain,
  activeTab,
  tasks,
  members,
  companies,
  clients,
  projectOptions,
}: Props) {
  return (
    <div className="space-y-6">
      <ProjectHeader
        project={project}
        workspaceDomain={workspaceDomain}
        companies={companies}
        clients={clients}
      />

      <ProjectTabs
        projectNanoid={project.nanoid}
        workspaceDomain={workspaceDomain}
        activeTab={activeTab}
        taskCount={tasks.length}
      />

      {activeTab === "overview" ? (
        <OverviewTab project={project} />
      ) : null}

      {activeTab === "tasks" ? (
        <TasksTab
          workspaceDomain={workspaceDomain}
          tasks={tasks}
          members={members}
          projectOptions={projectOptions}
        />
      ) : null}
    </div>
  );
}
