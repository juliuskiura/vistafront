"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Send, X, Edit3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { ScheduleItem } from "@/lib/api/types";
import { publishPostAction, cancelPostAction, updatePostAction } from "../actions";

/* ──────────────────────────────────────────────────────────────────────
 * Calendar Page Client — Content Calendar grid (dnd) + detail panel
 * ────────────────────────────────────────────────────────────────────── */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  scheduled: "bg-indigo-100 text-indigo-700 border-indigo-200",
  publishing: "bg-amber-100 text-amber-700 border-amber-200",
  published: "bg-emerald-100 text-emerald-700 border-emerald-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  canceled: "bg-slate-50 text-slate-400 border-slate-200 line-through",
};

/* The engine returns normalized items; the calendar only needs this subset. */
interface CalendarPost {
  nanoid: string;
  scheduled_at: string;
  status: string;
  content: string;
  campaign_name?: string | null;
  published_at?: string | null;
}

function toCalendarPost(item: ScheduleItem): CalendarPost {
  return {
    nanoid: item.nanoid,
    scheduled_at: item.scheduled_at ?? item.start,
    status: item.status ?? "draft",
    content: item.content ?? item.title,
    campaign_name: item.campaign_name ?? null,
    published_at: item.published_at ?? null,
  };
}

function DraggablePost({ post }: { post: CalendarPost }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: post.nanoid,
    data: { post },
  });
  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, opacity: isDragging ? 0.4 : 1 }
    : undefined;
  const statusStyle = STATUS_STYLES[post.status] || "";

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`cursor-grab active:cursor-grabbing rounded-lg border px-2 py-1 text-[10px] leading-tight truncate transition-shadow hover:shadow-sm ${statusStyle}`}
      title={post.content}
    >
      {post.content.slice(0, 30)}
      {post.content.length > 30 ? "…" : ""}
    </div>
  );
}

function DroppableDay({
  dateKey,
  dateObj,
  children,
  posts,
}: {
  dateKey: string;
  dateObj: Date;
  children: React.ReactNode;
  posts: CalendarPost[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: dateKey });
  const isToday = isSameDay(dateObj, new Date());
  const dayNum = dateObj.getDate();

  return (
    <div
      ref={setNodeRef}
      className={`relative min-h-[90px] rounded-lg border p-1.5 transition-colors ${isOver ? "border-indigo-400 bg-indigo-50/50 ring-1 ring-indigo-400" : "border-slate-100"} ${isToday ? "bg-slate-50" : "bg-white"}`}
    >
      <span
        className={`mb-1 block text-[10px] font-medium ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white" : "text-slate-500"}`}
      >
        {dayNum}
      </span>
      <div className="space-y-0.5">
        {children}
        {posts.length > 3 && (
          <span className="block text-[10px] font-medium text-indigo-600">+{posts.length - 3} more</span>
        )}
      </div>
    </div>
  );
}

interface Props {
  year: number;
  month: number;
  items: ScheduleItem[];
  prevHref: string;
  nextHref: string;
  todayHref: string;
  workspaceDomain: string;
}

export function CalendarClient({
  year,
  month,
  items,
  prevHref,
  nextHref,
  todayHref,
  workspaceDomain,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const basePath = `/${ws}/dashboard/socialmanager`;

  const [viewDate, setViewDate] = useState(() => new Date(year, month, 1));
  const [selectedPost, setSelectedPost] = useState<CalendarPost | null>(null);
  const [activePost, setActivePost] = useState<CalendarPost | null>(null);
  const [busy, setBusy] = useState(false);

  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const posts = useMemo(() => items.map(toCalendarPost), [items]);

  const postsByDate = useMemo(() => {
    const map: Record<string, CalendarPost[]> = {};
    for (const post of posts) {
      const dateKey = format(parseISO(post.scheduled_at), "yyyy-MM-dd");
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(post);
    }
    return map;
  }, [posts]);

  /* Sync local view state with the server-rendered active month.
   * The server owns the canonical `?year&month`; we keep `viewDate` in sync
   * so prev/next navigation via the URL (server-rendered) stays consistent. */
  useEffect(() => {
    setViewDate(new Date(year, month, 1));
  }, [year, month]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const post = event.active.data.current?.post as CalendarPost | undefined;
    if (post) setActivePost(post);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActivePost(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const post = active.data.current?.post as CalendarPost | undefined;
      if (!post) return;
      const newDateKey = over.id as string;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(newDateKey)) return;
      const newDate = parseISO(newDateKey);
      const oldDate = parseISO(post.scheduled_at);
      if (isSameDay(newDate, oldDate)) return;
      newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
      await updatePostAction(post.nanoid, { scheduled_at: newDate.toISOString() }, ws);
      router.refresh();
    },
    [ws, router],
  );

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const handlePublish = async (nanoid: string) => {
    setBusy(true);
    await publishPostAction(nanoid, ws);
    setBusy(false);
    setSelectedPost(null);
    router.refresh();
  };

  const handleCancel = async (nanoid: string) => {
    setBusy(true);
    await cancelPostAction(nanoid, ws);
    setBusy(false);
    setSelectedPost(null);
    router.refresh();
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4">
        {/* Calendar */}
        <div className="flex-1 min-w-0 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Content Calendar</h2>
            <div className="flex items-center gap-2">
              <a
                href={prevHref}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </a>
              <span className="w-40 text-center text-sm font-medium text-slate-700">
                {MONTHS[month]} {year}
              </span>
              <a
                href={nextHref}
                className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-2 text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ChevronRight className="h-4 w-4" />
              </a>
              <a
                href={todayHref}
                className="ml-2 inline-flex h-8 items-center rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 transition-colors hover:bg-slate-50"
              >
                Today
              </a>
            </div>
          </div>

          <Card className="p-3">
            <div className="mb-1 grid grid-cols-7 gap-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  {d}
                </div>
              ))}
            </div>

            <div className="space-y-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((day) => {
                    const dateKey = format(day, "yyyy-MM-dd");
                    const dayPosts = postsByDate[dateKey] || [];
                    const visible = dayPosts.slice(0, 3);
                    const inMonth = isSameMonth(day, viewDate);
                    return (
                      <DroppableDay key={dateKey} dateKey={dateKey} dateObj={day} posts={dayPosts}>
                        {!inMonth && <div className="pointer-events-none absolute inset-0 bg-slate-50/50" />}
                        {inMonth &&
                          visible.map((post) => (
                            <button
                              key={post.nanoid}
                              onClick={() => setSelectedPost(post)}
                              className="w-full text-left"
                            >
                              <DraggablePost post={post} />
                            </button>
                          ))}
                      </DroppableDay>
                    );
                  })}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Detail panel */}
        {selectedPost && (
          <div className="w-72 shrink-0 space-y-3">
            <Card className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Post Details</h3>
                <button onClick={() => setSelectedPost(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500">Status:</span>
                  <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-medium ${STATUS_STYLES[selectedPost.status] || "bg-slate-100 text-slate-600"}`}>
                    {selectedPost.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Scheduled:</span>
                  <span className="ml-1 font-medium text-slate-900">
                    {format(parseISO(selectedPost.scheduled_at), "MMM d, yyyy h:mm a")}
                  </span>
                </div>
                {selectedPost.campaign_name && (
                  <div>
                    <span className="text-slate-500">Campaign:</span>
                    <span className="ml-1 text-slate-900">{selectedPost.campaign_name}</span>
                  </div>
                )}
                {selectedPost.published_at && (
                  <div>
                    <span className="text-slate-500">Published:</span>
                    <span className="ml-1 text-slate-900">{format(parseISO(selectedPost.published_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="line-clamp-4 text-[11px] leading-relaxed text-slate-700">
                  {selectedPost.content || "(no content)"}
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <a
                  href={`${basePath}/compose?edit=${selectedPost.nanoid}`}
                  className="inline-flex h-8 items-center justify-start gap-1.5 rounded-md border border-slate-200 px-3 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </a>
                {selectedPost.status === "scheduled" && (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handlePublish(selectedPost.nanoid)}
                      className="inline-flex h-8 items-center justify-start gap-1.5 rounded-md bg-primary-600 px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Send className="h-3.5 w-3.5" /> Publish Now
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleCancel(selectedPost.nanoid)}
                      className="inline-flex h-8 items-center justify-start gap-1.5 rounded-md border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </button>
                  </>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>

      <DragOverlay>
        {activePost && (
          <div className="rounded-lg border border-indigo-300 bg-indigo-50 px-2.5 py-1.5 text-[10px] shadow-lg">
            {activePost.content.slice(0, 40)}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
