"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  Edit3,
  FolderKanban,
  GitBranch,
  ListTodo,
  Plus,
  Trash2,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskForm } from "../../forms/task-form";
import type { PickerOption } from "../../forms/project-form";
import { deleteTaskAction } from "../../actions/task-actions";

const NAV_ITEMS: InnerNavItem[] = [];

interface Props {
  children: React.ReactNode;
  workspaceDomain: string;
  task: any;
  members: PickerOption[];
  projects: PickerOption[];
  parentTask?: any;
}

export function TaskDetailShell({
  children,
  workspaceDomain,
  task,
  members,
  projects,
  parentTask,
}: Props) {
  const router = useRouter();
  const projectBase = task.project
    ? `/${workspaceDomain}/dashboard/projects/${task.project}`
    : `/${workspaceDomain}/dashboard/projects`;
  const basePath = `/${workspaceDomain}/dashboard/projects`;
  const taskBase = `/${workspaceDomain}/dashboard/projects/tasks`;
  const navItems: InnerNavItem[] = [
    {
      label: "Tasks",
      href: task.project ? `/${task.project}/tasks` : "/tasks",
      icon: ListTodo,
    },
  ];
  if (task.project) {
    navItems.push({
      label: "View Parent Project",
      href: `/${task.project}`,
      icon: FolderKanban,
    });
  }
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [subtaskOpen, setSubtaskOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trailing = undefined;

  const actionsGroup = {
    label: "Actions",
    icon: Edit3,
    items: [
      ...(!task.parent
        ? [{ label: "Add SubTask", icon: Plus, onClick: () => setSubtaskOpen(true) }]
        : []),
      { label: "Edit Task", icon: Edit3, onClick: () => setEditOpen(true) },
      { label: "Assign Task", icon: UserPlus, onClick: () => setEditOpen(true) },
      {
        label: "Delete Task",
        icon: Trash2,
        destructive: true,
        onClick: () => setDeleteOpen(true),
      },
    ],
  };

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title={task.title}
        description={
          [
            task.project_name ?? "No project",
            task.assignee_name ? `Assigned: ${task.assignee_name}` : "Unassigned",
            task.due_date ? `Due ${task.due_date}` : null,
          ]
            .filter(Boolean)
            .join(" · ")
        }
      />
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Project Manager"
        brandIcon={FolderKanban}
        items={navItems}
        groups={[actionsGroup]}
        trailing={trailing}
      />
      <div className="flex-1 p-4 md:p-6">{children}</div>

       <Dialog
         open={subtaskOpen}
         onOpenChange={(open) => !open && setSubtaskOpen(false)}
       >
         <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
           <DialogHeader>
             <DialogTitle>Add subtask</DialogTitle>
             <DialogDescription>
               A subtask belongs to “{task.title}”.
             </DialogDescription>
           </DialogHeader>
           <TaskForm
             workspaceDomain={workspaceDomain}
             task={undefined}
             projects={projects}
             members={members}
             defaultProject={task.project ?? undefined}
             defaultParent={task.nanoid}
             defaultParentName={task.title}
             defaultParentTaskId={task.task_id}
             parentCreatedAt={task.created_at}
             submitLabel="Add subtask"
             onSuccess={() => setSubtaskOpen(false)}
           />
         </DialogContent>
       </Dialog>

       <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit task</DialogTitle>
            <DialogDescription>Update the details of this task.</DialogDescription>
          </DialogHeader>
          <TaskForm
            workspaceDomain={workspaceDomain}
            task={task}
            projects={projects}
            members={members}
            submitLabel="Save changes"
            onSuccess={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this task?"
        description="This task will be deleted. This cannot be undone."
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={async () => {
          const result = await deleteTaskAction({
            workspaceDomain,
            nanoid: task.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The task could not be deleted.");
          } else {
            if (task.project) {
              router.push(`/${workspaceDomain}/dashboard/projects/${task.project}?tab=tasks`);
            } else {
              router.push(`/${workspaceDomain}/dashboard/projects`);
            }
          }
        }}
      />
      {error ? (
        <p className="mt-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
