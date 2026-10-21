"use client";

import type { Project, Task } from "@/lib/api";
import { ProjectHeader } from "./_components/project-header";
import { ProjectTabs } from "./_components/project-tabs";
import { OverviewTab } from "./_components/overview-tab";
import { DeliverablesTab } from "./_components/deliverables-tab";
import { TasksTab } from "./_components/tasks-tab";
import type { DeliverableRow } from "../record-types";
import type { PickerOption } from "../forms/project-form";

interface Props {
  project: Project;
  workspaceDomain: string;
  activeTab: string;
  deliverables: DeliverableRow[];
  /** Every deliverable in the project, whether or not its detail was loaded. */
  deliverableCount: number;
  tasks: Task[];
  members: PickerOption[];
  companies: PickerOption[];
  clients: PickerOption[];
  deliverableOptions: PickerOption[];
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
  deliverables,
  deliverableCount,
  tasks,
  members,
  companies,
  clients,
  deliverableOptions,
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
        deliverableCount={deliverableCount}
        taskCount={tasks.length}
      />

      {activeTab === "overview" ? (
        <OverviewTab project={project} />
      ) : null}

      {activeTab === "deliverables" ? (
        <DeliverablesTab
          project={project}
          workspaceDomain={workspaceDomain}
          deliverables={deliverables}
          tasks={tasks}
          members={members}
          deliverableOptions={deliverableOptions}
        />
      ) : null}

      {activeTab === "tasks" ? (
        <TasksTab
          workspaceDomain={workspaceDomain}
          tasks={tasks}
          members={members}
          deliverableOptions={deliverableOptions}
        />
      ) : null}
    </div>
  );
}
