"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock,
  ListOrdered,
  PenLine,
  Send,
  Sparkles,
  Upload,
  Users,
  Wifi,
  MessageCircle,
  Heart,
  type LucideIcon,
} from "lucide-react";

import type {
  ManagedChannel,
  PostQueue,
  ScheduledPost,
  SocialMediaPlatform,
} from "@/lib/api/types";
import { syncPostsAction, getPostsSyncStatusAction } from "./actions";
import { PlatformGlyph, getPlatformStyle } from "@/components/platform-icon";
import { Card } from "@/components/ui/card";

/* ──────────────────────────────────────────────────────────────────────
 * Constants — match the frontapp layout exactly
 * ────────────────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-violet-700 bg-violet-50 border-violet-200",
  published: "text-emerald-700 bg-emerald-50 border-emerald-200",
  draft: "text-amber-700 bg-amber-50 border-amber-200",
  publishing: "text-sky-700 bg-sky-50 border-sky-200",
  failed: "text-red-700 bg-red-50 border-red-200",
  canceled: "text-slate-600 bg-slate-50 border-slate-200",
};

const QUICK_ACTIONS: { label: string; description: string; icon: LucideIcon; href: string; color: string; bg: string }[] = [
  { label: "Compose", description: "Create and schedule posts", icon: PenLine, href: "compose", color: "text-indigo-600", bg: "bg-indigo-50" },
  { label: "Calendar", description: "Drag-and-drop scheduling", icon: CalendarDays, href: "calendar", color: "text-violet-600", bg: "bg-violet-50" },
  { label: "Queues", description: "Repeating post schedules", icon: ListOrdered, href: "queues", color: "text-emerald-600", bg: "bg-emerald-50" },
  { label: "Bulk Upload", description: "Import posts from CSV", icon: Upload, href: "bulk-upload", color: "text-amber-600", bg: "bg-amber-50" },
  { label: "Analytics", description: "Per-platform insights", icon: BarChart3, href: "analytics", color: "text-rose-600", bg: "bg-rose-50" },
  { label: "Connected Channels", description: "Connect social channels", icon: Users, href: "channels", color: "text-sky-600", bg: "bg-sky-50" },
];

/* ──────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RecipientChip({
  managedPageName,
  channel,
}: {
  managedPageName: string;
  channel?: ManagedChannel;
}) {
  if (!channel) {
    return (
      <span className="rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-neutral-600">
        {managedPageName}
      </span>
    );
  }
  const style = getPlatformStyle(channel.platform);
  const platformLabel = channel.platform_name || style.label;
  const displayName = channel.page_name || managedPageName;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-md border px-1.5 py-0.5 ${style.bg} ${style.border}`}
    >
      <PlatformGlyph platform={channel.platform} size="sm" />
      <span className="truncate text-[10px] font-medium text-neutral-700">
        {platformLabel} · {displayName}
      </span>
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Component
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  pages: ManagedChannel[];
  posts: ScheduledPost[];
  platforms: SocialMediaPlatform[];
  queues: PostQueue[];
  workspaceDomain: string;
}

export function SocialHomePageClient({
  pages: rawPages,
  posts,
  queues,
  workspaceDomain,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const basePath = `/${ws}/dashboard/socialmanager`;

  /* ── Sync state ── */
  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    skipped: number;
    errors: { page: string; error: string }[];
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = useCallback(async () => {
    setSyncResult(null);
    setIsSyncing(true);
    try {
      const res = await syncPostsAction({}, ws);
      if ("task_id" in res) setSyncTaskId(res.task_id);
    } finally {
      setIsSyncing(false);
    }
  }, [ws]);

  /* Poll sync status every 2s while a task is in flight */
  useEffect(() => {
    if (!syncTaskId) return;
    const iv = setInterval(async () => {
      try {
        const status = await getPostsSyncStatusAction(syncTaskId, ws);
        if (status.status === "SUCCESS" || status.status === "FAILURE") {
          if (status.result) setSyncResult(status.result);
          setSyncTaskId(null);
          clearInterval(iv);
        }
      } catch {
        /* ignore transient errors */
      }
    }, 2000);
    return () => clearInterval(iv);
  }, [syncTaskId, ws]);

  /* ── Derived data ── */
  const connectedPages = useMemo(() => rawPages.filter((p) => p.is_active), [rawPages]);

  const pagesByNanoid = useMemo(
    () => new Map(rawPages.map((p) => [p.nanoid, p] as const)),
    [rawPages],
  );

  const scheduled = useMemo(() => posts.filter((p) => p.status === "scheduled"), [posts]);
  const drafts = useMemo(() => posts.filter((p) => p.status === "draft"), [posts]);
  const published = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);

  const upcoming = useMemo(
    () =>
      [...scheduled]
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 5),
    [scheduled],
  );

  const recent = useMemo(
    () =>
      [...posts]
        .sort(
          (a, b) =>
            new Date(b.published_at || b.scheduled_at || b.created_at).getTime() -
            new Date(a.published_at || a.scheduled_at || a.created_at).getTime(),
        )
        .slice(0, 8),
    [posts],
  );

  const stats = [
    { label: "Connected", value: connectedPages.length, icon: Wifi, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Scheduled", value: scheduled.length, icon: Clock, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Published", value: published.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Drafts", value: drafts.length, icon: PenLine, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-6">
      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex size-10 items-center justify-center rounded-xl ${stat.bg} ${stat.color}`}>
                <stat.icon className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* ── Recent posts ── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">Recent Posts</h3>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing || !!syncTaskId}
              className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
            >
              <svg
                className={`size-3.5 ${isSyncing || syncTaskId ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isSyncing || syncTaskId ? "Syncing…" : "Sync from channels"}
            </button>
            <Link
              href={`${basePath}/calendar`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
            >
              View all →
            </Link>
          </div>
        </div>

        {/* Post table */}
        {recent.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium text-neutral-500">
                <tr>
                  <th className="px-4 py-2.5">Content</th>
                  <th className="px-4 py-2.5">Platforms</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5">Live Stream</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {recent.map((post) => (
                  <tr key={post.nanoid} className="hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {post.media_image_urls?.[0] ? (
                          <img
                            src={post.media_image_urls[0]}
                            alt=""
                            className="size-10 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-400">
                            TXT
                          </div>
                        )}
                        <span className="line-clamp-2 max-w-[320px] text-sm text-neutral-900">
                          {post.content || "No content"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {post.recipients.length === 0 ? (
                        <span className="text-xs text-neutral-400">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {post.recipients.slice(0, 3).map((r) => {
                            const page = pagesByNanoid.get(r.managed_page);
                            const platform = page?.platform || "";
                            const style = getPlatformStyle(platform);
                            const avatar = page?.profile_picture_url;
                            const displayName = page?.page_name || r.managed_page_name;
                            const platformLabel = page?.platform_name || style.label;
                            return (
                              <span key={r.nanoid} className="flex items-center gap-1.5">
                                <span className="relative shrink-0">
                                  {avatar ? (
                                    <img
                                      src={avatar}
                                      alt=""
                                      className="size-8 rounded-full object-cover shadow ring-1 ring-black/5"
                                    />
                                  ) : (
                                    <span
                                      className={`flex size-8 items-center justify-center rounded-full text-[10px] font-bold shadow ring-1 ring-black/5 ${style.bg} ${style.color}`}
                                    >
                                      {displayName.slice(0, 1).toUpperCase()}
                                    </span>
                                  )}
                                  {platform && (
                                    <span className="absolute bottom-0 right-0 flex size-4 translate-x-1/4 translate-y-1/4 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5">
                                      <PlatformGlyph platform={platform} size="sm" />
                                    </span>
                                  )}
                                </span>
                                <span className="flex flex-col">
                                  <span className="max-w-[140px] truncate text-xs font-medium text-neutral-700">
                                    {displayName}
                                  </span>
                                  <span className={`text-[10px] capitalize ${style.color}`}>
                                    {platformLabel}
                                  </span>
                                </span>
                              </span>
                            );
                          })}
                          {post.recipients.length > 3 && (
                            <span className="flex items-center rounded-md bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
                              +{post.recipients.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {post.synced_from_channel && (
                          <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                            Synced
                          </span>
                        )}
                        <span
                          className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                          }`}
                        >
                          {post.status}
                        </span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                      {formatDate(post.published_at || post.scheduled_at || post.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-neutral-600" title="Audience comments">
                          <MessageCircle className="size-3.5 text-neutral-400" />
                          {post.comments_count ?? 0}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-neutral-600" title="Reactions">
                          <Heart className="size-3.5 text-rose-400" />
                          {post.reactions_count ?? 0}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
            No posts yet.{" "}
            <Link href={`${basePath}/compose`} className="font-semibold text-indigo-600 hover:text-indigo-700">
              Compose one →
            </Link>
          </div>
        )}

        {/* Sync result */}
        {syncResult && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <span className="font-semibold">✓</span>
              Sync complete — {syncResult.created} new post{syncResult.created === 1 ? "" : "s"} imported,{" "}
              {syncResult.skipped} skipped
              {syncResult.errors.length > 0 && `, ${syncResult.errors.length} page(s) failed`}.
            </div>
            {syncResult.errors.map((err, i) => (
              <div
                key={i}
                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                <span className="font-semibold">{err.page || "A channel"}</span> couldn't be read: {err.error}
                {err.page && (
                  <Link href={`${basePath}/channels`} className="ml-1 font-semibold text-indigo-600 hover:text-indigo-700">
                    Reconnect →
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick actions ── */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">Quick Actions</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              href={`${basePath}/${action.href}`}
              className="rounded-xl border bg-card p-4 text-card-foreground transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 items-center justify-center rounded-xl ${action.bg} ${action.color}`}>
                    <action.icon className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-neutral-900">{action.label}</h4>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <svg className="size-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Upcoming + Connected channels ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming posts */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Upcoming Posts</h3>
            <Link href={`${basePath}/calendar`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              View calendar →
            </Link>
          </div>
          {upcoming.length > 0 ? (
            <div className="space-y-3">
              {upcoming.map((post) => (
                <Card key={post.nanoid} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-neutral-900">{post.content || "No content"}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(post.scheduled_at)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${
                        STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  {post.recipients.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {post.recipients.map((r) => (
                        <RecipientChip
                          key={r.nanoid}
                          managedPageName={r.managed_page_name}
                          channel={pagesByNanoid.get(r.managed_page)}
                        />
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
              No upcoming posts.{" "}
              <Link href={`${basePath}/compose`} className="font-semibold text-indigo-600 hover:text-indigo-700">
                Compose one →
              </Link>
            </div>
          )}
        </div>

        {/* Connected channels */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-900">Connected Channels</h3>
            <Link href={`${basePath}/channels`} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
              Manage →
            </Link>
          </div>
          {connectedPages.length > 0 ? (
            <div className="space-y-3">
              {connectedPages.map((page) => {
                return (
                  <Card key={page.nanoid} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex size-9 shrink-0 items-center justify-center rounded-xl border ${getPlatformStyle(page.platform).bg} ${getPlatformStyle(page.platform).border}`}>
                        <PlatformGlyph platform={page.platform} size="md" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">{page.page_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {page.platform_name || getPlatformStyle(page.platform).label}
                          {page.account_name && page.account_name !== page.page_name
                            ? ` · ${page.account_name}`
                            : ""}
                        </p>
                      </div>
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
              No channels connected yet.{" "}
              <Link href={`${basePath}/channels`} className="font-semibold text-indigo-600 hover:text-indigo-700">
                Connect your first account →
              </Link>
            </div>
          )}

          {/* Queues */}
          {queues.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Queues</h3>
              <div className="space-y-2">
                {queues.slice(0, 3).map((queue) => (
                  <Card
                    key={queue.nanoid}
                    className="p-3"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-emerald-600" />
                      <span className="text-sm text-neutral-900">{queue.name}</span>
                      <span
                        className={`ml-auto text-[10px] font-semibold ${
                          queue.is_active ? "text-emerald-600" : "text-neutral-400"
                        }`}
                      >
                        {queue.is_active ? "Active" : "Paused"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
