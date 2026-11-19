"use client";

import { useState } from "react";

import { FolderKanban, Plus, ListTodo, Layers } from "@/lib/icons";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import { formatMediumDate } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "../forms/task-form";
import type { PickerOption } from "../forms/project-form";
import type { Task } from "@/lib/api";

interface Props {
  children: React.ReactNode;
  workspaceDomain: string;
  project: {
    nanoid: string;
    name: string;
    description?: string | null;
    company_name?: string | null;
    deadline?: string | null;
  };
  tasks: Task[];
  members: PickerOption[];
}

export function ProjectDetailShell({
  children,
  workspaceDomain,
  project,
  tasks,
  members,
}: Props) {
  const basePath = `/${workspaceDomain}/dashboard/projects`;

  const [parentPickerOpen, setParentPickerOpen] = useState(false);
  const [subtaskParent, setSubtaskParent] = useState<Task | null>(null);

  const projectOptions = [{ nanoid: project.nanoid, name: project.name }];

  const navItems: InnerNavItem[] = [
    {
      label: "Create New Project",
      href: `${basePath}/new`,
      icon: Plus,
    },
    {
      label: "Add Tasks",
      href: `${basePath}/${project.nanoid}?tab=tasks`,
      icon: ListTodo,
    },
    {
      label: "Add Subtasks",
      icon: Layers,
      onClick: () => setParentPickerOpen(true),
    },
  ];

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={project.name}
        description={
          [
            project.company_name ?? "No company",
            project.deadline ? `Due ${formatMediumDate(project.deadline)}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Project details"
        }
      />
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Project Manager"
        brandIcon={FolderKanban}
        items={navItems}
      />
      <div className="flex-1 p-4 md:p-6">{children}</div>

      <Dialog open={parentPickerOpen} onOpenChange={setParentPickerOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Select parent task</DialogTitle>
            <DialogDescription>
              Choose the task that the new subtask will belong to.
            </DialogDescription>
          </DialogHeader>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No tasks available. Add a task first.
            </p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {tasks
                .filter((t) => !t.parent && t.project === project.nanoid)
                .map((t) => (
                  <li key={t.nanoid}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => {
                        setParentPickerOpen(false);
                        setSubtaskParent(t);
                      }}
                    >
                      {t.title}
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={subtaskParent !== null}
        onOpenChange={(open) => !open && setSubtaskParent(null)}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add subtask</DialogTitle>
            <DialogDescription>
              A subtask belongs to “{subtaskParent?.title}”.
            </DialogDescription>
          </DialogHeader>
          {subtaskParent ? (
            <TaskForm
              workspaceDomain={workspaceDomain}
              projects={projectOptions}
              members={members}
              defaultProject={project.nanoid}
              defaultParent={subtaskParent.nanoid}
              defaultParentName={subtaskParent.title}
              defaultParentTaskId={subtaskParent.task_id}
              parentCreatedAt={subtaskParent.created_at}
              submitLabel="Add subtask"
              onSuccess={() => setSubtaskParent(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}