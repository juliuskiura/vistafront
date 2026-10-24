"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ProjectSummary, Task } from "@/lib/api";
import { Plus } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ProjectsFilterBar } from "./_components/projects-filter-bar";
import { ProjectsTable } from "./_components/projects-table";
import { KanbanBoard } from "./_components/kanban-board";

interface Props {
  projects: ProjectSummary[];
  tasks: Task[];
  workspaceDomain: string;
  /** How many projects the workspace really has. */
  total: number;
  /** True when the workspace has more projects than were fetched. */
  truncated: boolean;
}

/**
 * The projects list.
 *
 * The search and the two dropdowns filter in the browser, over the whole
 * set the server sent — the backend's project endpoint applies no
 * filtering of its own.
 *
 * A toggle switches between a project table and a task kanban board.
 */
export function ProjectsList({
  projects,
  tasks,
  workspaceDomain,
  total,
  truncated,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [view, setView] = useState<"table" | "kanban">("table");

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (status && project.status !== status) return false;
      if (priority && project.priority !== priority) return false;
      if (!needle) return true;
      return [project.name, project.company_name, project.client_name]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [projects, search, status, priority]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProjectsFilterBar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
          priority={priority}
          onPriorityChange={setPriority}
          resultCount={filtered.length}
          totalCount={total}
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={view === "table" ? "default" : "outline"}
            onClick={() => setView("table")}
          >
            Table
          </Button>
          <Button
            size="sm"
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
          >
            Kanban
          </Button>
          <Button asChild size="sm">
            <Link href={`/${workspaceDomain}/dashboard/projects/new`}>
              <Plus className="size-4" aria-hidden="true" />
              New project
            </Link>
          </Button>
        </div>
      </div>

      {truncated ? (
        <p className="rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
          This workspace has {total} projects. Only the first 100 are listed
          here — narrow the list with the filters above.
        </p>
      ) : null}

      {view === "table" ? (
        <ProjectsTable
          projects={filtered}
          workspaceDomain={workspaceDomain}
        />
      ) : (
        <KanbanBoard
          tasks={tasks}
          projects={filtered}
          workspaceDomain={workspaceDomain}
        />
      )}
    </div>
  );
}
