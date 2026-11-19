"use client";

import Link from "next/link";
import { ProjectTabs } from "./_components/project-tabs";
import { OverviewTab } from "./_components/overview-tab";
import { TasksTab } from "./_components/tasks-tab";
import type { Project, Task, Note } from "@/lib/api";
import type { PickerOption } from "../forms/project-form";

interface Props {
  project: Project;
  workspaceDomain: string;
  activeTab: string;
  tasks: Task[];
  members: PickerOption[];
  /** The current project, as a single-option picker for the task form. */
  projectOptions: PickerOption[];
  notes?: Note[];
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
  projectOptions,
  notes = [],
}: Props) {
  return (
    <div className="space-y-6">

      <ProjectTabs
        projectNanoid={project.nanoid}
        workspaceDomain={workspaceDomain}
        activeTab={activeTab}
        taskCount={tasks.length}
        noteCount={notes.length}
      />

      {activeTab === "overview" ? (
        <OverviewTab project={project} workspaceDomain={workspaceDomain} />
      ) : null}

      {activeTab === "tasks" ? (
        <TasksTab
          workspaceDomain={workspaceDomain}
          tasks={tasks}
          members={members}
          projectOptions={projectOptions}
        />
      ) : null}

      {activeTab === "notes" ? (
        <div className="space-y-3">
          {notes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notes attached yet.</p>
          ) : (
            <ul className="space-y-2">
              {notes.map((note) => (
                <li key={note.nanoid} className="rounded-md border p-3">
                  <Link
                    href={`/${workspaceDomain}/dashboard/notebook/${note.nanoid}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {note.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
