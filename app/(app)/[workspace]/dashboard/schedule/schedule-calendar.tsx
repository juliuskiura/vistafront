"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ScheduleItem } from "@/lib/api";

interface Props {
  year: number;
  month: number;
  items: ScheduleItem[];
  prevHref: string;
  nextHref: string;
  todayHref: string;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const TYPE_COLORS: Record<string, string> = {
  task: "bg-blue-500",
  deliverable: "bg-purple-500",
  project_deadline: "bg-red-500",
  activity: "bg-green-500",
  post: "bg-indigo-500",
};

const DEFAULT_LEGEND = [
  { type: "task", label: "Tasks", color: "bg-blue-500" },
  { type: "deliverable", label: "Deliverables", color: "bg-purple-500" },
  { type: "project_deadline", label: "Project deadlines", color: "bg-red-500" },
  { type: "activity", label: "Activities", color: "bg-green-500" },
  { type: "post", label: "Posts", color: "bg-indigo-500" },
];

function dateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/**
 * Schedule calendar grid (Client Component island).
 *
 * Month navigation uses Server-rendered hrefs so changing month re-fetches
 * the calendar on the server — no client fetching of server data. The
 * interactive slice this client owns is the day-detail sheet: clicking a
 * day opens a drawer listing that day's items; clicking an item routes to
 * its `url` via `router.push`.
 */
export function ScheduleCalendar({
  year,
  month,
  items,
  prevHref,
  nextHref,
  todayHref,
}: Props) {
  const router = useRouter();
  const [openDate, setOpenDate] = useState<string | null>(null);

  const todayKey = useMemo(() => {
    const d = new Date();
    return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const itemsByDate = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    for (const item of items) {
      if (!map[item.date]) map[item.date] = [];
      map[item.date].push(item);
    }
    return map;
  }, [items]);

  const lastDay = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const weeks: (number | null)[][] = [];
  let cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push(d);
    if (cells.length === 7) {
      weeks.push(cells);
      cells = [];
    }
  }
  if (cells.length > 0) {
    while (cells.length < 7) cells.push(null);
    weeks.push(cells);
  }

  const sheetItems = openDate ? itemsByDate[openDate] ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-muted-foreground">
            Upcoming work across every module, sorted by date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={todayHref}
            className="text-xs font-medium text-blue-600 hover:underline"
          >
            Today
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={prevHref}
              aria-label="Previous month"
              className="inline-flex h-7 w-7 items-center justify-center rounded border text-sm hover:bg-muted"
            >
              ←
            </Link>
            <span className="w-36 text-center text-sm font-medium">
              {MONTHS[month]} {year}
            </span>
            <Link
              href={nextHref}
              aria-label="Next month"
              className="inline-flex h-7 w-7 items-center justify-center rounded border text-sm hover:bg-muted"
            >
              →
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {DEFAULT_LEGEND.map((l) => (
          <span key={l.type} className="flex items-center gap-1">
            <span className={`inline-block h-2 w-2 rounded-full ${l.color}`} />
            {l.label}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 overflow-hidden rounded-xl border bg-card">
        {DAYS.map((day) => (
          <div
            key={day}
            className="border-b border-r bg-muted/30 p-2 text-center text-xs font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}

        {weeks.flat().map((day, idx) => {
          if (day === null) {
            return (
              <div
                key={`e-${idx}`}
                className="min-h-[90px] border-b border-r bg-muted/10 p-1"
              />
            );
          }
          const key = dateKey(year, month, day);
          const dayItems = itemsByDate[key] ?? [];
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setOpenDate(key)}
              className={`min-h-[90px] cursor-pointer border-b border-r p-1 text-left transition-colors hover:bg-muted/30 ${
                isToday ? "bg-blue-50/50 ring-1 ring-inset ring-blue-200" : ""
              }`}
            >
              <div
                className={`mb-1 flex items-center gap-0.5 text-xs font-medium ${
                  isToday
                    ? "h-5 w-5 justify-center rounded-full bg-blue-600 text-white"
                    : "text-muted-foreground"
                }`}
              >
                <span>{day}</span>
              </div>
              {dayItems.length > 0 ? (
                <div className="space-y-0.5">
                  {dayItems.slice(0, 4).map((item, i) => (
                    <div
                      key={`${item.type}-${item.nanoid}-${i}`}
                      className="flex items-center gap-1 rounded px-1 py-0.5"
                    >
                      <span
                        className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                          TYPE_COLORS[item.type] ?? "bg-gray-400"
                        }`}
                      />
                      <span className="truncate text-[10px]">{item.title}</span>
                    </div>
                  ))}
                  {dayItems.length > 4 ? (
                    <div className="pl-2 text-[10px] text-muted-foreground">
                      +{dayItems.length - 4} more
                    </div>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <Sheet
        open={openDate !== null}
        onOpenChange={(open) => {
          if (!open) setOpenDate(null);
        }}
      >
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>
              {openDate
                ? new Date(`${openDate}T12:00:00`).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-2 overflow-y-auto p-4">
            {sheetItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing scheduled.
              </p>
            ) : (
              sheetItems.map((item, i) => (
                <button
                  key={`sheet-${item.type}-${item.nanoid}-${i}`}
                  type="button"
                  className="group flex w-full items-center gap-3 rounded-lg border bg-card p-3 text-left text-sm transition-colors hover:bg-muted"
                  onClick={() => {
                    if (item.url) {
                      setOpenDate(null);
                      router.push(item.url);
                    }
                  }}
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                      TYPE_COLORS[item.type] ?? "bg-gray-400"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.project_name ?? item.campaign_name ?? item.source}
                    </p>
                  </div>
                  <span className="text-[10px] font-medium uppercase text-muted-foreground">
                    {item.type}
                  </span>
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}