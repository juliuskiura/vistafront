"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import type {
  ScheduleDeliverableSummary,
  ScheduleProjectSummary,
  ScheduleTaskSummary,
  TodaySummary,
} from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function fetchToday(workspace: string): Promise<TodaySummary> {
  const res = await fetch(
    `/api/schedules/today?workspace=${encodeURIComponent(workspace)}`,
    { credentials: "include" },
  );
  if (!res.ok) {
    throw new Error(`Today fetch failed: ${res.status}`);
  }
  return res.json();
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-100 text-gray-600",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const DELIVERABLE_STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-amber-100 text-amber-800",
  revisions: "bg-orange-100 text-orange-800",
  approved: "bg-emerald-100 text-emerald-800",
  published: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const EMPTY: TodaySummary = {
  overdue_tasks: [],
  today_tasks: [],
  needs_review: [],
  upcoming_projects: [],
};

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return "—";
  }
}

function TaskRow({
  task,
  activeDomain,
  variant,
}: {
  task: ScheduleTaskSummary;
  activeDomain: string;
  variant: "overdue" | "today";
}) {
  const tone =
    variant === "overdue"
      ? "border-red-200 hover:bg-red-50/80"
      : "border-amber-200 hover:bg-amber-50/80";
  const bg = variant === "overdue" ? "bg-red-50/50" : "bg-amber-50/50";
  const href = task.project
    ? `/${activeDomain}/dashboard/projects/${task.project}`
    : "#";
  return (
    <Link
      href={href}
      className={`flex items-start justify-between gap-2 rounded-lg border ${tone} ${bg} p-3 text-sm`}
    >
      <p className="min-w-0 flex-1 truncate font-medium">{task.title}</p>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${
          PRIORITY_COLORS[task.priority] ?? ""
        }`}
      >
        {task.priority}
      </span>
      <p className="w-full text-xs text-muted-foreground">
        {task.project_name} · Due {fmtDate(task.due_date)}
      </p>
    </Link>
  );
}

function DeliverableRow({
  deliverable,
  activeDomain,
}: {
  deliverable: ScheduleDeliverableSummary;
  activeDomain: string;
}) {
  const href = `/${activeDomain}/dashboard/deliverables/${deliverable.nanoid}`;
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm hover:bg-blue-50/80"
    >
      <p className="min-w-0 flex-1 truncate font-medium">{deliverable.title}</p>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${
          DELIVERABLE_STATUS_COLORS[deliverable.status] ?? ""
        }`}
      >
        {deliverable.status.replace(/_/g, " ")}
      </span>
      <p className="w-full truncate text-xs text-muted-foreground">
        {deliverable.project_name}
      </p>
    </Link>
  );
}

function ProjectRow({
  project,
  activeDomain,
}: {
  project: ScheduleProjectSummary;
  activeDomain: string;
}) {
  const href = `/${activeDomain}/dashboard/projects/${project.nanoid}`;
  return (
    <Link
      href={href}
      className="flex items-start justify-between gap-2 rounded-lg border border-green-200 bg-green-50/50 p-3 text-sm hover:bg-green-50/80"
    >
      <p className="min-w-0 flex-1 truncate font-medium">{project.name}</p>
      <span
        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize ${
          PRIORITY_COLORS[project.priority] ?? ""
        }`}
      >
        {project.priority}
      </span>
      <p className="w-full text-xs text-muted-foreground">
        Due {fmtDate(project.deadline)}
      </p>
    </Link>
  );
}

/**
 * Client island for the Today page. Uses `useQuery` against the same
 * queryKey the Server Component prefetched under `<HydrationBoundary>`.
 *
 * Refreshes every 60 seconds while the page is open — the original
 * Server-Component version had to be re-navigated to see new items.
 */
export function TodayBoard({ workspace }: { workspace: string }) {
  const { data = EMPTY } = useQuery<TodaySummary>({
    queryKey: ["today", workspace],
    queryFn: () => fetchToday(workspace),
    refetchInterval: 60_000,
  });

  const overdue = data.overdue_tasks;
  const todayTasks = data.today_tasks;
  const review = data.needs_review;
  const upcoming = data.upcoming_projects;
  const total = overdue.length + todayTasks.length + review.length + upcoming.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {total > 0
            ? `${total} item${total !== 1 ? "s" : ""} needing attention`
            : "Nothing for today — nice!"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {overdue.length > 0 ? (
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-red-700">
                {overdue.length} Overdue Task{overdue.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {overdue.map((t) => (
                <TaskRow
                  key={t.nanoid}
                  task={t}
                  activeDomain={workspace}
                  variant="overdue"
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {todayTasks.length > 0 ? (
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-amber-700">
                {todayTasks.length} Due Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {todayTasks.map((t) => (
                <TaskRow
                  key={t.nanoid}
                  task={t}
                  activeDomain={workspace}
                  variant="today"
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {review.length > 0 ? (
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-blue-700">
                {review.length} Needs Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {review.map((d) => (
                <DeliverableRow
                  key={d.nanoid}
                  deliverable={d}
                  activeDomain={workspace}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {upcoming.length > 0 ? (
          <Card className="rounded-xl border bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-green-700">
                Upcoming Project Deadlines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {upcoming.map((p) => (
                <ProjectRow
                  key={p.nanoid}
                  project={p}
                  activeDomain={workspace}
                />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {total === 0 ? (
          <Card className="rounded-xl border bg-card lg:col-span-2">
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              No overdue tasks, no tasks due today, nothing in review, no
              upcoming deadlines. Everything is on track.
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}