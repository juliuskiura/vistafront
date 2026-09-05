import { serverFetch } from "./server-fetch";
import { toQueryString } from "./query-string";
import type {
  ScheduleFilters,
  ScheduleResponse,
  TodaySummary,
} from "./types";

/* ──────────────────────────────────────────────────────────────────────
 * Merged calendar
 *
 * Backed by `/apis/schedules/schedule/`. The engine asks every registered
 * provider for its dated items between `start` and `end`, sorts them, and
 * returns a single chronologically ordered list. Filters (sources, types,
 * tags) are passed straight through so a deep-linked filter (e.g.
 * `/schedule?sources=socialmanager`) narrows the response server-side.
 *
 * The `workspace` option is required — schedule endpoints are tenant-scoped
 * and the `X-Workspace` header must be set so the calendar merges the
 * correct tenant's items.
 * ────────────────────────────────────────────────────────────────────── */

export interface GetScheduleOptions {
  start: string;
  end: string;
  filters?: ScheduleFilters;
  workspace: string;
}

export function getSchedule({
  start,
  end,
  filters,
  workspace,
}: GetScheduleOptions): Promise<ScheduleResponse> {
  return serverFetch<ScheduleResponse>(
    `/apis/schedules/schedule/${toQueryString({
      start,
      end,
      sources: filters?.sources?.join(","),
      types: filters?.types?.join(","),
      tags: filters?.tags?.join(","),
    })}`,
    { workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Today summary
 *
 * Backed by `/apis/schedules/today/`. Returns overdue tasks, tasks due
 * today, deliverables awaiting review, and upcoming project deadlines —
 * the four buckets the Today page renders. Tenant-scoped; pass
 * `workspace` (the active workspace slug from ``requireWorkspace``).
 * ────────────────────────────────────────────────────────────────────── */

export function getTodaySummary(workspace: string): Promise<TodaySummary> {
  return serverFetch<TodaySummary>("/apis/schedules/today/", { workspace });
}