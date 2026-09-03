import { requireWorkspace } from "@/lib/auth/server";
import { getSchedule } from "@/lib/api";
import { CalendarClient } from "./calendar-client";

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function lastOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function parseYearMonth(sp: Record<string, string | string[] | undefined>): { year: number; month: number } {
  const now = new Date();
  const yearRaw = Array.isArray(sp.year) ? sp.year[0] : sp.year;
  const monthRaw = Array.isArray(sp.month) ? sp.month[0] : sp.month;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 0 || month > 11) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year, month };
}

/**
 * Calendar (Server Component).
 *
 * Month calendar grid backed by the schedule API. Active month lives in
 * URL search params so navigation is server-rendered. The interactive
 * drag-and-drop and detail panel are Client Components.
 */
export default async function CalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);
  const ws = active.domain;

  const { year, month } = parseYearMonth(sp);

  const start = firstOfMonth(year, month);
  const end = lastOfMonth(year, month);

  const schedule = await getSchedule({
    start,
    end,
    filters: { sources: ["socialmanager"] },
    workspace: ws,
  }).catch(() => ({ items: [], start, end }));

  function buildHref(y: number, m: number): string {
    return `/${ws}/dashboard/socialmanager/calendar?year=${y}&month=${m}`;
  }

  const prevHref = buildHref(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  const nextHref = buildHref(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  const now = new Date();
  const todayHref = buildHref(now.getFullYear(), now.getMonth());

  return (
    <CalendarClient
      year={year}
      month={month}
      items={schedule.items}
      prevHref={prevHref}
      nextHref={nextHref}
      todayHref={todayHref}
      workspaceDomain={ws}
    />
  );
}
