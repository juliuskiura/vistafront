import { requireWorkspace } from "@/lib/auth/server";
import { getSchedule, type ScheduleFilters } from "@/lib/api";
import { ScheduleCalendar } from "@/app/(app)/[workspace]/dashboard/schedule/schedule-calendar";

interface PageProps {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function firstOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function lastOfMonth(year: number, month: number): string {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

function parseYearMonth(
  sp: Record<string, string | string[] | undefined>,
): { year: number; month: number } {
  const now = new Date();
  const yearRaw = Array.isArray(sp.year) ? sp.year[0] : sp.year;
  const monthRaw = Array.isArray(sp.month) ? sp.month[0] : sp.month;
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  if (!Number.isFinite(year) || !Number.isFinite(month)) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  if (month < 0 || month > 11) {
    return { year: now.getFullYear(), month: now.getMonth() };
  }
  return { year, month };
}

function parseFilters(
  sp: Record<string, string | string[] | undefined>,
): ScheduleFilters {
  const csv = (k: string): string[] | undefined => {
    const raw = sp[k];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (!value) return undefined;
    const split = value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return split.length > 0 ? split : undefined;
  };
  return {
    sources: csv("sources"),
    types: csv("types") as ScheduleFilters["types"],
    tags: csv("tags"),
  };
}

/**
 * Schedule (Server Component).
 *
 * Calendar grid backed by `/apis/schedules/schedule/`. The active month
 * and filter state live in the URL (`?year=…&month=…&sources=…&types=…`)
 * so month changes navigate via the Server Component and re-fetch on the
 * server — no client-side fetch, no `useEffect`. The interactive slice
 * (day-detail sheet) is the only Client Component in the tree.
 */
export default async function SchedulePage({
  params,
  searchParams,
}: PageProps) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);

  const { year, month } = parseYearMonth(sp);
  const filters = parseFilters(sp);

  const initial = await getSchedule({
    start: firstOfMonth(year, month),
    end: lastOfMonth(year, month),
    filters,
    workspace: active.domain,
  }).catch(() => ({ items: [], start: firstOfMonth(year, month), end: lastOfMonth(year, month) }));

  const activeDomain = active.domain.toLowerCase();
  function buildHref(y: number, m: number): string {
    const qs = new URLSearchParams();
    qs.set("year", String(y));
    qs.set("month", String(m));
    if (filters.sources?.length) qs.set("sources", filters.sources.join(","));
    if (filters.types?.length) qs.set("types", filters.types.join(","));
    if (filters.tags?.length) qs.set("tags", filters.tags.join(","));
    return `/${activeDomain}/dashboard/schedule?${qs.toString()}`;
  }
  const prevHref = buildHref(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1);
  const nextHref = buildHref(month === 11 ? year + 1 : year, month === 11 ? 0 : month + 1);
  const now = new Date();
  const todayHref = buildHref(now.getFullYear(), now.getMonth());

  return (
    <ScheduleCalendar
      year={year}
      month={month}
      items={initial.items}
      prevHref={prevHref}
      nextHref={nextHref}
      todayHref={todayHref}
    />
  );
}