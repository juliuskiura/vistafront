"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit3,
  FolderKanban,
  GitBranch,
  ListTodo,
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

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Tasks", href: "", end: true, icon: ListTodo },
  { label: "Projects", href: "..", icon: FolderKanban },
];

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
  const basePath = `/${workspaceDomain}/dashboard/projects/tasks`;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trailing = (
    <div className="flex flex-wrap items-center gap-2">
      {task.project ? (
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href={`/${workspaceDomain}/dashboard/projects/${task.project}`}>
            <FolderKanban className="size-3.5" />
            View Parent Project
          </Link>
        </Button>
      ) : null}
      {parentTask ? (
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-8 text-xs"
        >
          <Link href={`${basePath}/${parentTask.nanoid}`}>
            <GitBranch className="size-3.5" />
            Parent Task
          </Link>
        </Button>
      ) : null}
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setEditOpen(true)}
      >
        <Edit3 className="size-3.5" />
        Edit Task
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setEditOpen(true)}
      >
        <UserPlus className="size-3.5" />
        Assign Task
      </Button>
      <Button
        variant="destructive"
        size="sm"
        className="h-8 text-xs"
        onClick={() => setDeleteOpen(true)}
      >
        <Trash2 className="size-3.5" />
        Delete Task
      </Button>
      <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
        <Link href={`/${workspaceDomain}/dashboard/projects`}>
          <ArrowLeft className="size-3.5" />
          Back to Projects
        </Link>
      </Button>
    </div>
  );

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
        brandLabel="Task"
        brandIcon={ListTodo}
        items={NAV_ITEMS}
        hideBrand
        trailing={trailing}
      />
      <div className="mt-6 flex-1">{children}</div>

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
