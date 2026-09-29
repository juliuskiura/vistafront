"use client";

import { useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Clock,
  Edit3,
  ExternalLink,
  Heart,
  Info,
  MessageCircle,
  MoreVertical,
  Pause,
  RefreshCcw,
  RefreshCw,
  Send,
  Share2,
  Trash2,
  Copy,
  FileText,
  Users,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  ChevronRight,
} from "@/lib/icons";

import type { ScheduledPost, PostComment, MetricSnapshot, ManagedChannel } from "@/lib/api/types";
import { PlatformGlyph, usePlatformStyleResolver } from "@/components/platform-icon";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DeliveryOutcomes } from "@/components/socialmanager/delivery-outcomes";
import { retryAvailability } from "@/lib/social/delivery-error";
import {
  publishPostAction,
  retryPostAction,
  cancelPostAction,
  deletePostAction,
  duplicatePostAction,
  syncCommentsAction,
  listPostCommentsAction,
} from "../actions";

/* ──────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────── */

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDateOnly(iso);
}

const STATUS_STYLES: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle2 }
> = {
  scheduled: {
    label: "Scheduled",
    className: "text-violet-700 bg-violet-50 border-violet-200",
    icon: Clock,
  },
  published: {
    label: "Published",
    className: "text-emerald-700 bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
  },
  draft: {
    label: "Draft",
    className: "text-amber-700 bg-amber-50 border-amber-200",
    icon: FileText,
  },
  publishing: {
    label: "Publishing",
    className: "text-sky-700 bg-sky-50 border-sky-200",
    icon: Loader2,
  },
  failed: {
    label: "Failed",
    className: "text-red-700 bg-red-50 border-red-200",
    icon: XCircle,
  },
  canceled: {
    label: "Canceled",
    className: "text-slate-600 bg-slate-50 border-slate-200",
    icon: XCircle,
  },
};

/* ──────────────────────────────────────────────────────────────────────
 * Mini inline SVG chart — no extra dependency
 * ────────────────────────────────────────────────────────────────────── */

function SparkAreaChart({ data }: { data: number[] }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const width = 600;
  const height = 160;
  const padding = 24;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const step = chartW / (data.length - 1 || 1);

  const points = data
    .map((v, i) => {
      const x = padding + i * step;
      const y = padding + chartH - (v / max) * chartH;
      return `${x},${y}`;
    })
    .join(" ");

  const areaPath = `M${padding},${padding + chartH} L${points.split(" ").join(" L")} L${padding + chartW},${padding + chartH} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="size-full w-full"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity={0.25} />
          <stop offset="100%" stopColor="currentColor" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" className="text-primary-500" />
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        points={points}
        className="text-primary-600"
      />
      {data.map((v, i) => {
        const x = padding + i * step;
        const y = padding + chartH - (v / max) * chartH;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={3}
            className="fill-white stroke-primary-600 stroke-2"
          />
        );
      })}
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Sub-components
 * ────────────────────────────────────────────────────────────────────── */

function PostMediaPreview({ post }: { post: ScheduledPost }) {
  const imageUrls = post.media_image_urls;
  const images = imageUrls?.length ? imageUrls : post.media_urls;
  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50">
        <div className="text-center">
          <FileText className="mx-auto size-10 text-neutral-300" />
          <p className="mt-2 text-sm text-neutral-500">Text-only post</p>
        </div>
      </div>
    );
  }
  if (images.length === 1) {
    return (
      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <img
          src={images[0]}
          alt=""
          className="size-full max-h-[420px] object-cover"
        />
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {images.slice(0, 4).map((src, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
        >
          <img src={src} alt="" className="size-full max-h-[200px] object-cover" />
        </div>
      ))}
      {images.length > 4 && (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-200 bg-neutral-50 text-sm font-medium text-neutral-600">
          +{images.length - 4} more
        </div>
      )}
    </div>
  );
}

function EngagementKPIs({ post, comments, metrics }: { post: ScheduledPost; comments: PostComment[]; metrics: MetricSnapshot[] }) {
  const reactions = post.reactions_count ?? 0;
  const commentCount = post.comments_count ?? comments.length;
  const shares = metrics.filter((m) => m.metric.toLowerCase().includes("share")).reduce((s, m) => s + m.value, 0);
  const saves = metrics.filter((m) => m.metric.toLowerCase().includes("save")).reduce((s, m) => s + m.value, 0);
  const clicks = metrics.filter((m) => m.metric.toLowerCase().includes("click")).reduce((s, m) => s + m.value, 0);
  const impressions = metrics.find((m) => m.metric.toLowerCase().includes("impression"))?.value ?? 0;
  const reach = metrics.find((m) => m.metric.toLowerCase().includes("reach"))?.value ?? 0;
  const engagementRate = impressions > 0 ? ((reactions + commentCount + shares) / impressions) * 100 : 0;

  const kpis = [
    { label: "Impressions", value: impressions.toLocaleString() },
    { label: "Reach", value: reach.toLocaleString() },
    { label: "Reactions", value: reactions.toLocaleString(), icon: Heart },
    { label: "Comments", value: commentCount.toLocaleString(), icon: MessageCircle },
    { label: "Shares", value: shares.toLocaleString() },
    { label: "Saves", value: saves.toLocaleString() },
    { label: "Clicks", value: clicks.toLocaleString() },
    { label: "Engagement", value: `${engagementRate.toFixed(2)}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="rounded-xl border border-neutral-200 bg-white p-3"
        >
          <p className="text-xs text-neutral-500">{kpi.label}</p>
          <div className="mt-1 flex items-center gap-1.5">
            {kpi.icon && <kpi.icon className="size-3.5 text-neutral-400" />}
            <p className="text-lg font-semibold text-neutral-900">{kpi.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommentsSection({
  comments,
  onRefresh,
  syncing,
}: {
  comments: PostComment[];
  onRefresh: () => void;
  syncing: boolean;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3">
        <h3 className="text-sm font-semibold text-neutral-900">Comments</h3>
        <button
          type="button"
          onClick={onRefresh}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          <RefreshCcw className={`size-3.5 ${syncing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>
      {comments.length === 0 ? (
        <div className="p-6 text-center text-sm text-neutral-500">
          No comments yet.{" "}
          <button
            type="button"
            onClick={onRefresh}
            className="font-semibold text-primary-600 hover:text-primary-700"
          >
            Sync comments →
          </button>
        </div>
      ) : (
        <div className="max-h-[320px] space-y-4 overflow-y-auto p-5">
          {comments.map((c) => (
            <div key={c.nanoid} className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-violet-600 text-xs font-bold text-white">
                {c.author_name?.charAt(0).toUpperCase() ?? "?"}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">{c.author_name}</p>
                  <span className="text-[10px] text-neutral-400">{timeAgo(c.created_at)}</span>
                </div>
                <p className="mt-0.5 text-sm text-neutral-700">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricChart({ metrics }: { metrics: MetricSnapshot[] }) {
  const impressions = useMemo(
    () =>
      metrics
        .filter((m) => m.metric.toLowerCase().includes("impression"))
        .sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime()),
    [metrics],
  );

  const values = impressions.map((m) => m.value);

  if (!impressions.length) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center text-sm text-neutral-500">
        No time-series engagement data yet.{" "}
        <button
          type="button"
          className="font-semibold text-primary-600 hover:text-primary-700"
        >
          Sync analytics →
        </button>
      </div>
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Engagement over time</h3>
        <span className="text-xs text-neutral-500">Impressions · last {values.length} points</span>
      </div>
      <div className="relative h-40 w-full">
        <SparkAreaChart data={values} />
      </div>
    </Card>
  );
}

function PostActionsMenu({
  post,
  onAction,
  hasFailedRecipients,
}: {
  post: ScheduledPost;
  onAction: (action: string) => void;
  /** Whether a retry is worth offering. Driven by the recipients rather than
   *  the post status, because a retry with nothing to retry is a 400 — and a
   *  post can be `failed` with every channel already delivered. */
  hasFailedRecipients: boolean;
}) {
  const [open, setOpen] = useState(false);

  const actions = [
    { label: "Edit", icon: Edit3, action: "edit" },
    { label: "Duplicate", icon: Copy, action: "duplicate" },
    { label: "View on platform", icon: ExternalLink, action: "view" },
    { label: "Share", icon: Share2, action: "share" },
    post.status === "scheduled" ? { label: "Pause", icon: Pause, action: "cancel" } : null,
    // Retry is offered only when there is genuinely something to re-attempt.
    // A post can reach one channel and fail another, so the failed post already
    // has a "Publish now" above — but publishing it again would re-post to the
    // channel that worked. Retry re-attempts only the failures, so it is the
    // action that actually helps, and it disappears once there are none left.
    hasFailedRecipients
      ? { label: "Retry failed channels", icon: RefreshCw, action: "retry" }
      : null,
    post.status === "failed" || post.status === "draft"
      ? { label: "Publish now", icon: Send, action: "publish" }
      : null,
    { label: "Delete", icon: Trash2, action: "delete", danger: true },
  ].filter(Boolean) as { label: string; icon: typeof Edit3; action: string; danger?: boolean }[];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 hover:bg-neutral-50"
      >
        <MoreVertical className="size-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
            {actions.map((item) => (
              <button
                key={item.action}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onAction(item.action);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 ${
                  item.danger ? "text-red-600 hover:text-red-700" : "text-neutral-700"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  post: ScheduledPost;
  comments: PostComment[];
  metrics: MetricSnapshot[];
  workspaceDomain: string;
  /**
   * Managed channels, keyed by nanoid. A recipient carries only the page name,
   * so this is the only way to reach the page's platform — and therefore the
   * icon — for a post that targets channels on several networks.
   */
  pages: ManagedChannel[];
}

export function PostDetailClient({
  post: initialPost,
  comments: initialComments,
  metrics,
  workspaceDomain,
  pages,
}: Props) {
  const router = useRouter();
  const basePath = `/${workspaceDomain}/dashboard/socialmanager`;
  const { brandOf } = usePlatformBrand();
  const styleOf = usePlatformStyleResolver();
  const pageByNanoid = useMemo(
    () => new Map(pages.map((p) => [p.nanoid, p] as const)),
    [pages],
  );

  const [post, setPost] = useState<ScheduledPost>(initialPost);
  const [comments, setComments] = useState<PostComment[]>(initialComments);
  const [syncingComments, setSyncingComments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const onRefreshComments = useCallback(async () => {
    setSyncingComments(true);
    try {
      const page = post.recipients[0]?.managed_page;
      const res = await syncCommentsAction(
        {
          scheduled_post: post.nanoid,
          managed_page: page,
        },
        workspaceDomain,
      );
      if ("task_id" in res && res.task_id) {
        await new Promise((r) => setTimeout(r, 1200));
      }
      const refreshed = await listPostCommentsAction(post.nanoid, workspaceDomain);
      setComments(refreshed);
    } finally {
      setSyncingComments(false);
    }
  }, [post, workspaceDomain]);

  const handleAction = useCallback(
    async (action: string) => {
      setError(null);
      try {
        switch (action) {
          case "edit": {
            router.push(`${basePath}/compose?edit=${post.nanoid}`);
            break;
          }
          case "duplicate": {
            const res = await duplicatePostAction(post.nanoid, workspaceDomain);
            if ("post" in res) {
              // `postId` is a path segment, not a query param. Pushing it
              // literally sent the user to a URL containing "[postId]".
              router.push(`${basePath}/${res.post.nanoid}`);
            }
            break;
          }
          case "view": {
            const url = post.recipients[0]?.link_url;
            if (url) window.open(url, "_blank");
            break;
          }
          case "share": {
            await navigator.clipboard.writeText(`${window.location.origin}/${workspaceDomain}/dashboard/socialmanager/${post.nanoid}`);
            break;
          }
          case "cancel": {
            const res = await cancelPostAction(post.nanoid, workspaceDomain);
            if ("post" in res) {
              setPost(res.post);
            }
            break;
          }
          case "retry": {
            const res = await retryPostAction(post.nanoid, workspaceDomain);
            if (res.status === "success" && "post" in res) {
              setPost(res.post);
            } else if (res.status === "error") {
              setError(res.message || "Retry failed.");
            }
            break;
          }
          case "publish": {
            const res = await publishPostAction(post.nanoid, workspaceDomain);
            if ("post" in res) {
              setPost(res.post);
            }
            break;
          }
          case "delete": {
            await deletePostAction(post.nanoid, workspaceDomain);
            setDeleteDialogOpen(false);
            router.push(`${basePath}`);
            break;
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      }
    },
    [post, workspaceDomain, router, basePath],
  );

  /** Route a menu entry: destructive ones open the dialog instead of firing.
   *
   * The overflow menu called `handleAction("delete")` directly, so deleting
   * from the menu skipped the confirmation the button row requires. */
  const requestAction = useCallback(
    (action: string) => {
      if (action === "delete") {
        setDeleteDialogOpen(true);
        return;
      }
      void handleAction(action);
    },
    [handleAction],
  );

  const retryCheck = retryAvailability(post);
  const retryBlockedReason = retryCheck.available ? null : retryCheck.reason;

  const statusCfg = STATUS_STYLES[post.status] ?? STATUS_STYLES.draft;
  const StatusIcon = statusCfg.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ── Breadcrumb + actions ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`${basePath}`}
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <ChevronRight className="size-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-900">Post detail</span>
        </div>
        <PostActionsMenu
          post={post}
          onAction={requestAction}
          hasFailedRecipients={retryCheck.available}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle className="mr-1 inline size-4" />
          {error}
        </div>
      )}

      {/* ── Hero card: media + caption + meta ── */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,1fr)_320px]">
          {/* Left: media + caption */}
          <div className="space-y-4">
            <PostMediaPreview post={post} />

            <div className="space-y-2">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">
                {post.content || <span className="italic text-neutral-400">No content</span>}
              </p>
              {post.recipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.recipients.map((r) => {
                    // The page carries the connect door; the chip is branded with
                    // the brand behind it. `managed_page_name` is a display label,
                    // never a platform slug — looking an icon up by it always missed.
                    const page = pageByNanoid.get(r.managed_page);
                    const style = styleOf(page?.platform);
                    return (
                      <span
                        key={r.nanoid}
                        className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[10px] font-semibold ${style.bg} ${style.border} ${style.color}`}
                      >
                        {page?.platform ? (
                          <PlatformGlyph platform={brandOf(page.platform)} size="sm" />
                        ) : null}
                        {page?.platform_name || r.managed_page_name}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: meta panel */}
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusCfg.className}`}
                >
                  <StatusIcon className={`size-3.5 ${post.status === "publishing" ? "animate-spin" : ""}`} />
                  {statusCfg.label}
                </span>
                {post.synced_from_channel && (
                  <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-neutral-500">
                    Synced
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <MetaRow icon={CalendarClock} label="Scheduled" value={formatDateTime(post.scheduled_at)} />
                {post.published_at && <MetaRow icon={Send} label="Published" value={formatDateTime(post.published_at)} />}
                <MetaRow icon={Clock} label="Created" value={formatDateTime(post.created_at)} />
                <MetaRow icon={Clock} label="Updated" value={formatDateTime(post.updated_at)} />
                <MetaRow icon={ImageIcon} label="Media" value={`${(post.media_image_urls?.length || post.media_urls?.length || 0)} items`} />
                <MetaRow icon={Users} label="Recipients" value={`${post.recipients.length} pages`} />
              </div>
            </div>

            {/* Per-channel outcomes replace the single aggregate message.
                A multi-channel post's `error_message` is just "One or more
                recipients failed" — the reason a channel failed, and whether
                another attempt helps, only exist on the recipient rows. */}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-3">
              <DeliveryOutcomes recipients={post.recipients} />
              {!post.recipients.length && post.error_message && (
                <p className="text-xs text-red-700">{post.error_message}</p>
              )}
              {retryBlockedReason && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-amber-700">
                  <Info className="mt-0.5 size-3 shrink-0" />
                  {retryBlockedReason}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleAction("edit")}
              >
                <Edit3 className="size-3.5" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleAction("duplicate")}
              >
                <Copy className="size-3.5" /> Duplicate
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => handleAction("share")}
              >
                <Share2 className="size-3.5" /> Share
              </Button>
              {post.status === "scheduled" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => handleAction("cancel")}
                >
                  <Pause className="size-3.5" /> Pause
                </Button>
              )}
              {retryCheck.available && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
                  onClick={() => handleAction("retry")}
                >
                  <RefreshCw className="size-3.5" /> Retry failed channels
                </Button>
              )}
              {(post.status === "failed" || post.status === "draft") && (
                <Button
                  size="sm"
                  className="gap-1.5 bg-gradient-to-r from-primary-600 to-violet-600 text-white hover:from-primary-500 hover:to-violet-500"
                  onClick={() => handleAction("publish")}
                >
                  <Send className="size-3.5" /> Publish now
                </Button>
              )}
              {post.status === "draft" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="size-3.5" /> Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* ── Engagement KPIs ── */}
      <EngagementKPIs post={post} comments={comments} metrics={metrics} />

      {/* ── Engagement chart ── */}
      <MetricChart metrics={metrics} />

      {/* ── Comments ── */}
      <CommentsSection
        comments={comments}
        onRefresh={onRefreshComments}
        syncing={syncingComments}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete draft post?"
        description="This will permanently delete this draft. This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={() => handleAction("delete")}
      />
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: typeof CalendarClock; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Icon className="size-3.5 text-neutral-400" />
        {label}
      </span>
      <span className="text-xs font-medium text-neutral-900">{value}</span>
    </div>
  );
}
