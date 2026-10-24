"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { Project, ProjectCategory, Task } from "@/lib/api";
import { formatMediumDate } from "@/lib/dates";
import {
  Building,
  CalendarIcon,
  CheckCircle2,
  CheckSquare,
  Filter,
  Plus,
  Search,
  User as UserIcon,
} from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  projects: Project[];
  tasks: Task[];
  categories: ProjectCategory[];
  workspaceDomain: string;
  /** How many projects the workspace really has. */
  total: number;
  /** True when the workspace has more projects than were fetched. */
  truncated: boolean;
}

const getStatusBadge = (status: Project["status"]) => {
  switch (status) {
    case "in_progress":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "planning":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "completed":
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    case "on_hold":
      return "text-slate-700 bg-slate-100 border-slate-200";
    case "cancelled":
      return "text-rose-700 bg-rose-50 border-rose-200";
    default:
      return "text-slate-700 bg-slate-100 border-slate-200";
  }
};

const getPriorityBadge = (priority: Project["priority"]) => {
  switch (priority) {
    case "urgent":
      return "text-rose-700 bg-rose-50 border-rose-200";
    case "high":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "medium":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "low":
      return "text-slate-600 bg-slate-100 border-slate-200";
    default:
      return "text-slate-600 bg-slate-100 border-slate-200";
  }
};

export function ProjectsList({
  projects,
  tasks,
  categories,
  workspaceDomain,
  total,
  truncated,
}: Props) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState("all");

  const topLevelTasks = useMemo(
    () => tasks.filter((t) => !t.parent),
    [tasks],
  );
  const subtasks = useMemo(
    () => tasks.filter((t) => !!t.parent),
    [tasks],
  );

  const companies = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) {
      if (p.company) map.set(p.company, p.company_name ?? p.company);
    }
    return [...map.entries()].map(([nanoid, name]) => ({ nanoid, name }));
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return projects.filter((project) => {
      if (statusFilter !== "all" && project.status !== statusFilter) return false;
      if (categoryFilter !== "all" && project.category !== categoryFilter)
        return false;
      if (priorityFilter !== "all" && project.priority !== priorityFilter)
        return false;
      if (
        selectedCompanyFilter !== "all" &&
        project.company !== selectedCompanyFilter
      )
        return false;

      if (needle) {
        const matchName = project.name.toLowerCase().includes(needle);
        const matchCompany = (project.company_name ?? "")
          .toLowerCase()
          .includes(needle);
        const matchClient = (project.client_name ?? "")
          .toLowerCase()
          .includes(needle);
        const matchNanoid = project.nanoid.toLowerCase().includes(needle);
        if (!matchName && !matchCompany && !matchClient && !matchNanoid)
          return false;
      }

      return true;
    });
  }, [
    projects,
    search,
    statusFilter,
    categoryFilter,
    priorityFilter,
    selectedCompanyFilter,
  ]);

  const workspaceStats = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(
      (p) => p.status === "in_progress" || p.status === "planning",
    ).length;
    const totalTasks = topLevelTasks.length;
    const doneTasks = topLevelTasks.filter((t) => t.status === "done").length;
    const overallProgress =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const totalSubtasks = subtasks.length;
    const doneSubtasks = subtasks.filter((t) => t.status === "done").length;
    const pendingReviewsCount = topLevelTasks.filter(
      (t) => t.status === "review",
    ).length;
    return {
      totalProjects,
      activeProjects,
      totalTasks,
      doneTasks,
      overallProgress,
      totalSubtasks,
      doneSubtasks,
      pendingReviewsCount,
    };
  }, [projects, topLevelTasks, subtasks]);

  const getProjectStats = (project: Project) => {
    const projTasks = topLevelTasks.filter((t) => t.project === project.nanoid);
    const totalTasks = projTasks.length;
    const doneTasks = projTasks.filter((t) => t.status === "done").length;
    const taskCompletionRate =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    const projSubtasks = tasks.filter(
      (t) => t.project === project.nanoid && !!t.parent,
    );
    const totalSubtasks = projSubtasks.length;
    const doneSubtasks = projSubtasks.filter((t) => t.status === "done").length;
    const isOverdue =
      !!project.deadline &&
      new Date(project.deadline) < new Date() &&
      project.status !== "completed";
    return {
      totalTasks,
      doneTasks,
      taskCompletionRate,
      totalSubtasks,
      doneSubtasks,
      isOverdue,
    };
  };

  const hasFilters =
    statusFilter !== "all" ||
    categoryFilter !== "all" ||
    priorityFilter !== "all" ||
    selectedCompanyFilter !== "all" ||
    search.trim() !== "";

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Top Portfolio Summary KPIs */}
      <div className="p-6 bg-white border-b border-slate-200 shrink-0">

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider mb-1">
              Active Client Projects
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {workspaceStats.activeProjects}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {workspaceStats.totalProjects} total
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider mb-1">
              Workspace Tasks
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 font-mono tabular-nums">
                {workspaceStats.doneTasks}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {workspaceStats.totalTasks} ({workspaceStats.overallProgress}%)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider mb-1">
              Subtasks Completed
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
                {workspaceStats.doneSubtasks}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                / {workspaceStats.totalSubtasks} checklist items
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 shadow-2xs">
            <span className="text-slate-500 text-[11px] font-semibold block uppercase tracking-wider mb-1">
              Client Review / QA
            </span>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  workspaceStats.pendingReviewsCount > 0
                    ? "text-amber-600"
                    : "text-slate-900"
                }`}
              >
                {workspaceStats.pendingReviewsCount}
              </span>
              <span className="text-xs text-slate-400">
                pending approval
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Ribbon */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
          <Filter className="size-3.5" />
          <span>Filters:</span>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="h-8 w-48 pl-8 text-xs"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="in_progress">In Progress</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories ({categories.length})</option>
          {categories.map((c) => (
            <option key={c.nanoid} value={c.key}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Priority filter */}
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        {/* Company filter */}
        <select
          value={selectedCompanyFilter}
          onChange={(e) => setSelectedCompanyFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded px-2.5 py-1 text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-indigo-500"
        >
          <option value="all">
            All Industry Companies ({companies.length})
          </option>
          {companies.map((cmp) => (
            <option key={cmp.nanoid} value={cmp.nanoid}>
              {cmp.name}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setCategoryFilter("all");
              setPriorityFilter("all");
              setSelectedCompanyFilter("all");
            }}
            className="text-xs text-indigo-600 hover:underline font-medium"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Projects Grid */}
      <div className="flex-1 p-6 overflow-y-auto">
        {truncated ? (
          <p className="mb-4 rounded-md bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
            This workspace has {total} projects. Only the first 100 are listed
            here — narrow the list with the filters above.
          </p>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-6xl">
          {filteredProjects.map((proj) => {
            const cat = categories.find((c) => c.key === proj.category);
            const comp = proj.company_name;
            const client = proj.client_name;
            const stats = getProjectStats(proj);

            return (
              <Link
                key={proj.nanoid}
                href={`/${workspaceDomain}/dashboard/projects/${proj.nanoid}`}
                className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Top Kicker: Category & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    {cat && (
                      <span
                        className="px-2 py-0.5 rounded font-mono font-bold text-[10px] border"
                        style={{
                          backgroundColor: `${cat.color}15`,
                          borderColor: `${cat.color}40`,
                          color: cat.color,
                        }}
                      >
                        {cat.name}
                      </span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] uppercase font-bold border ${getStatusBadge(
                          proj.status,
                        )}`}
                      >
                        {proj.status.replace("_", " ")}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase font-semibold border ${getPriorityBadge(
                          proj.priority,
                        )}`}
                      >
                        {proj.priority}
                      </span>
                    </div>
                  </div>

                  {/* Project Name */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug mb-2">
                    {proj.name}
                  </h3>

                  {/* Description snippet */}
                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                    {proj.description ?? ""}
                  </p>

                  {/* Stakeholders (Company & Client) */}
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                    {comp && (
                      <div className="flex items-center gap-1">
                        <Building className="size-3 text-slate-400" />
                        <span className="text-slate-800 font-semibold">
                          {comp}
                        </span>
                      </div>
                    )}
                    {client && (
                      <div className="flex items-center gap-1">
                        <UserIcon className="size-3 text-slate-400" />
                        <span>{client}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Execution Stats */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="size-3.5 text-slate-400" />
                      <span>
                        {stats.doneTasks} of {stats.totalTasks} tasks done
                      </span>
                    </span>
                    <span className="font-mono tabular-nums text-indigo-600 font-bold">
                      {stats.taskCompletionRate}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all rounded-full"
                      style={{ width: `${stats.taskCompletionRate}%` }}
                    />
                  </div>

                  {/* Subtasks & Due Date */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="size-3 text-emerald-600" />
                      <span className="font-mono tabular-nums">
                        {stats.doneSubtasks}/{stats.totalSubtasks} subtasks
                        completed
                      </span>
                    </span>

                    <div className="flex items-center gap-1 font-mono tabular-nums">
                      <CalendarIcon className="size-3 text-slate-400" />
                      <span
                        className={
                          stats.isOverdue
                            ? "text-rose-600 font-bold"
                            : "text-slate-700"
                        }
                      >
                        {proj.deadline
                          ? formatMediumDate(proj.deadline)
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-2 py-16 text-center border border-dashed border-slate-300 rounded-xl text-slate-500 text-sm bg-white">
              No projects found matching the selected filters.
              <div className="mt-2">
                <Link
                  href={`/${workspaceDomain}/dashboard/projects/new`}
                  className="text-indigo-600 hover:underline font-semibold text-xs"
                >
                  Create a new project
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
