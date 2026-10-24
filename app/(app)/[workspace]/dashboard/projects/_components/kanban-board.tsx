"use client";

import { useState, useCallback } from "react";

import type { ProjectSummary, Task, TaskStatus } from "@/lib/api";
import { Layers, Trash2, Users, Clock, Flag } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { formatMediumDate } from "@/lib/dates";
import { TASK_STATUS_LABELS } from "@/lib/projects/constants";
import { updateTaskStatusAction, deleteTaskAction } from "../actions/task-actions";

const KANBAN_STATUS_ORDER: TaskStatus[] = [
  "todo",
  "in_progress",
  "review",
  "done",
];

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-primary/10 text-primary border-primary/20",
  review: "bg-warning/10 text-warning border-warning/20",
  done: "bg-success/10 text-success border-success/20",
};

interface KanbanCardProps {
  task: Task;
  projectMap: Map<string, string>;
  workspaceDomain: string;
}

function KanbanCard({ task, projectMap, workspaceDomain }: KanbanCardProps) {
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const projectName = projectMap.get(task.project ?? "") ?? "—";

  const handleDragStart = (event: React.DragEvent) => {
    event.dataTransfer?.setData("task/nanoid", task.nanoid);
    event.dataTransfer?.setData("task/status", task.status);
    event.currentTarget.classList.add("opacity-50");
  };

  const handleDragEnd = () => {
    const el = document.querySelector(`[data-task-nanoid="${task.nanoid}"]`);
    if (el) el.classList.remove("opacity-50");
    setDragOver(false);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const nanoid = event.dataTransfer?.getData("task/nanoid");
    const fromStatus = event.dataTransfer?.getData("task/status");
    if (!nanoid || !fromStatus || nanoid === task.nanoid) return;
    const toStatus = task.status;
    if (fromStatus === toStatus) return;
    try {
      await updateTaskStatusAction({
        workspaceDomain,
        nanoid,
        status: toStatus,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Move failed.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteTaskAction({ workspaceDomain, nanoid: deleteTarget.nanoid });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <>
      <div
        data-task-nanoid={task.nanoid}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-lg border p-3 mb-2 bg-card transition-colors cursor-grab active:cursor-grabbing ${
          dragOver ? "ring-2 ring-primary" : ""
        }`}
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{task.title}</div>
            {task.description && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>{projectName}</span>
              {task.assignee_name && (
                <>
                  <Users className="size-3" aria-hidden="true" />
                  <span>{task.assignee_name}</span>
                </>
              )}
              {task.due_date && (
                <>
                  <Clock className="size-3" aria-hidden="true" />
                  <span>{formatMediumDate(task.due_date)}</span>
                </>
              )}
              {task.priority && (
                <>
                  <Flag className="size-3" aria-hidden="true" />
                  <span>{task.priority}</span>
                </>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="size-6 p-0 text-muted-foreground hover:text-destructive"
            onClick={() => setDeleteTarget(task)}
            aria-label={`Delete ${task.title}`}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null && deleteTarget.nanoid === task.nanoid}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete this task?"
        description={`“${deleteTarget?.title}” will be deleted. This cannot be undone.`}
        confirmLabel="Delete task"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive mt-2">
          {error}
        </p>
      ) : null}
    </>
  );
}

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  projectMap: Map<string, string>;
  workspaceDomain: string;
  onStatusChange: (nanoid: string, status: TaskStatus) => void;
}

function KanbanColumn({
  status,
  tasks,
  projectMap,
  workspaceDomain,
  onStatusChange,
}: KanbanColumnProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const nanoid = event.dataTransfer?.getData("task/nanoid");
    const fromStatus = event.dataTransfer?.getData("task/status");
    if (!nanoid || !fromStatus || fromStatus === status) return;
    try {
      await onStatusChange(nanoid, status);
    } catch {
      // Error handled at card level
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 min-w-[200px] flex flex-col gap-2 bg-muted/40 rounded-xl border p-2 ${
        dragOver ? "border-primary bg-muted/60" : ""
      }`}
    >
      <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ${
            STATUS_COLORS[status]
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {TASK_STATUS_LABELS[status]}
        </div>
        <span className="text-muted-foreground">{tasks.length}</span>
      </div>
      <div className="flex-1 min-h-[100px] flex flex-col gap-1 overflow-y-auto p-1">
        {tasks.map((task) => (
          <KanbanCard
            key={task.nanoid}
            task={task}
            projectMap={projectMap}
            workspaceDomain={workspaceDomain}
          />
        ))}
      </div>
    </div>
  );
}

interface KanbanBoardProps {
  tasks: Task[];
  projects: ProjectSummary[];
  workspaceDomain: string;
}

export function KanbanBoard({
  tasks,
  projects,
  workspaceDomain,
}: KanbanBoardProps) {
  const [error, setError] = useState<string | null>(null);

  const projectMap = new Map(projects.map((p) => [p.nanoid, p.name]));

  const columns = KANBAN_STATUS_ORDER.map((status) => ({
    status,
    tasks: tasks.filter((t) => t.status === status),
  }));

  const handleStatusChange = useCallback(
    async (nanoid: string, status: TaskStatus) => {
      try {
        await updateTaskStatusAction({ workspaceDomain, nanoid, status });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to move task.");
      }
    },
    [workspaceDomain],
  );

  if (tasks.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-10 text-center text-sm text-muted-foreground">
        <Layers className="mx-auto size-6 mb-2 opacity-50" aria-hidden="true" />
        <p>No tasks yet. Create a project and add tasks to see them on the board.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <div className="flex gap-2">
        {columns.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            tasks={column.tasks}
            projectMap={projectMap}
            workspaceDomain={workspaceDomain}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}
