"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  RefreshCw,
  BarChart3,
  Users,
  AlertCircle,
  ShieldCheck,
  Lock,
  MessageCircle,
  Heart,
  Send,
  Clock,
  ExternalLink,
  CheckCircle2,
  CloudDownload,
  Sparkles,
  Unplug,
  PenLine,
} from "lucide-react";

import type {
  ManagedChannel,
  ScheduledPost,
  PostComment,
  SocialMediaPlatform,
} from "@/lib/api/types";
import {
  syncPostsAction,
  getPostsSyncStatusAction,
  getConnectedInstagramAction,
  listPostCommentsAction,
  syncCommentsAction,
  revokeAccountAction,
} from "../../actions";
import { PlatformGlyph, getPlatformStyle } from "@/components/platform-icon";
import { SocialIcon, SocialIconSolid, hasSocialIcon } from "@/components/social-icons";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

/* ──────────────────────────────────────────────────────────────────────
 * Constants
 * ────────────────────────────────────────────────────────────────────── */

const STATUS_STYLES: Record<string, string> = {
  scheduled: "text-violet-700 bg-violet-50 border-violet-200",
  published: "text-emerald-700 bg-emerald-50 border-emerald-200",
  draft: "text-amber-700 bg-amber-50 border-amber-200",
  publishing: "text-sky-700 bg-sky-50 border-sky-200",
  failed: "text-red-700 bg-red-50 border-red-200",
  canceled: "text-slate-600 bg-slate-50 border-slate-200",
};

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  scheduled: { label: "Scheduled", badge: "bg-violet-50 text-violet-700 border-violet-200", dot: "bg-violet-500" },
  published: { label: "Published", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  draft: { label: "Draft", badge: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500" },
  publishing: { label: "Publishing", badge: "bg-sky-50 text-sky-700 border-sky-200", dot: "bg-sky-500" },
  failed: { label: "Failed", badge: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500" },
  canceled: { label: "Canceled", badge: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" },
};

const PLATFORM_GRADIENTS: Record<string, string> = {
  instagram: "from-pink-500 to-rose-500",
  facebook: "from-indigo-500 to-blue-500",
  x: "from-slate-700 to-slate-900",
  linkedin: "from-blue-600 to-blue-800",
  tiktok: "from-slate-800 to-zinc-950",
  youtube: "from-red-500 to-red-700",
  pinterest: "from-rose-500 to-red-600",
  threads: "from-zinc-700 to-zinc-900",
  bluesky: "from-sky-500 to-sky-700",
  mastodon: "from-purple-600 to-fuchsia-700",
  google_business: "from-amber-500 to-orange-600",
  start_page: "from-emerald-500 to-teal-600",
};

/* ──────────────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────────────── */

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getTokenStatus(expiresAt: string | null): {
  status: "active" | "expiring_soon" | "expired";
  days: number | null;
} {
  if (!expiresAt) return { status: "active", days: null };
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const days = Math.floor((expiry - now) / 86400000);
  if (expiry <= now) return { status: "expired", days: 0 };
  if (days <= 14) return { status: "expiring_soon", days };
  return { status: "active", days };
}

/* ──────────────────────────────────────────────────────────────────────
 * PostCommentsSheet (inline, matches original)
 * ────────────────────────────────────────────────────────────────────── */

function PostCommentsSheet({
  post,
  pageById,
  workspace,
  open,
  onOpenChange,
}: {
  post: ScheduledPost | null;
  pageById: Record<string, ManagedChannel>;
  workspace: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [commentSyncTask, setCommentSyncTask] = useState<string | null>(null);
  const [syncingComments, setSyncingComments] = useState(false);

  useEffect(() => {
    if (!open || !post) {
      setComments([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    listPostCommentsAction(post.nanoid, workspace)
      .then((data) => { if (!cancelled) setComments(data); })
      .catch(() => { if (!cancelled) setComments([]); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [open, post, workspace]);

  useEffect(() => {
    if (!commentSyncTask || !post) return;
    let cancelled = false;
    const iv = setInterval(async () => {
      try {
        const status = await getPostsSyncStatusAction(commentSyncTask, workspace);
        if (status.status === "SUCCESS" || status.status === "FAILURE") {
          setCommentSyncTask(null);
          clearInterval(iv);
          if (!cancelled) {
            const refreshed = await listPostCommentsAction(post.nanoid, workspace);
            setComments(refreshed);
          }
        }
      } catch { /* ignore */ }
    }, 2000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [commentSyncTask, post, workspace]);

  const handleSyncComments = async () => {
    if (!post) return;
    setSyncingComments(true);
    try {
      const res = await syncCommentsAction({ scheduled_post: post.nanoid }, workspace);
      if ("task_id" in res) setCommentSyncTask(res.task_id);
    } finally {
      setSyncingComments(false);
    }
  };

  const audience = comments.filter((c) => c.comment_type === "audience");
  const own = comments.filter((c) => c.comment_type === "internal");
  const recipients = post?.recipients ?? [];
  const primaryRecipient = recipients[0];
  const primaryPage = primaryRecipient ? pageById[primaryRecipient.managed_page] : undefined;
  const primaryPlatform = (primaryPage?.platform ?? "").toLowerCase();
  const primaryStyle = getPlatformStyle(primaryPlatform);
  const statusMeta = post ? STATUS_META[post.status] || STATUS_META.draft : STATUS_META.draft;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-lg">
        <div className="flex h-full flex-col">
          <div className={`relative bg-gradient-to-br ${PLATFORM_GRADIENTS[primaryPlatform] || "from-indigo-600 to-purple-600"}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
            <SheetHeader className="relative border-none bg-transparent p-5 text-white">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm`}>
                  <span className={`size-1.5 rounded-full ${statusMeta.dot} ring-2 ring-white/40`} />
                  {statusMeta.label}
                </span>
                {post?.synced_from_channel && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                    <CloudDownload className="size-3" />
                    Synced
                  </span>
                )}
                {post?.campaign_name && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                    <Sparkles className="size-3" />
                    {post.campaign_name}
                  </span>
                )}
              </div>

              <SheetTitle className="mt-3 line-clamp-3 text-base font-semibold text-white">
                {post?.content || "No content"}
              </SheetTitle>
              <SheetDescription className="line-clamp-1 text-white/70">
                {recipients.length > 0
                  ? `Posted to ${recipients.length} channel${recipients.length === 1 ? "" : "s"}`
                  : "Not yet delivered to any channel"}
              </SheetDescription>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur-sm">
                  <MessageCircle className="mx-auto size-4 text-white/80" />
                  <p className="mt-1 text-lg font-semibold leading-none">{post?.comments_count ?? 0}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/70">Comments</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur-sm">
                  <Heart className="mx-auto size-4 text-rose-300" />
                  <p className="mt-1 text-lg font-semibold leading-none">{post?.reactions_count ?? 0}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/70">Reactions</p>
                </div>
                <div className="rounded-xl bg-white/10 p-3 text-center ring-1 ring-white/15 backdrop-blur-sm">
                  <Send className="mx-auto size-4 text-white/80" />
                  <p className="mt-1 text-lg font-semibold leading-none">{recipients.length}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/70">Channels</p>
                </div>
              </div>
            </SheetHeader>
          </div>

          {recipients.length > 0 && (
            <div className="space-y-2 border-b border-border bg-muted/40 px-5 py-3">
              {recipients.map((r) => {
                const page = pageById[r.managed_page];
                const platform = (page?.platform ?? "").toLowerCase();
                const style = getPlatformStyle(platform);
                return (
                  <div
                    key={r.nanoid}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 shadow-sm"
                  >
                    <span className="relative shrink-0">
                      {page?.profile_picture_url ? (
                        <img src={page.profile_picture_url} alt="" className="size-9 rounded-full object-cover ring-1 ring-black/5" />
                      ) : (
                        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-slate-500 ring-1 ring-black/5">
                          {r.managed_page_name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 ${style.color}`}>
                        <SocialIconSolid name={platform} className="size-2.5" />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-medium text-slate-800">{r.managed_page_name}</span>
                      <span className={`flex items-center gap-1 text-[10px] capitalize ${style.color}`}>
                        {page?.platform_name || platform}
                        <span className="text-slate-300">·</span>
                        <Clock className="size-2.5 text-slate-400" />
                        <span className="text-muted-foreground">
                          {r.published_at ? `Synced ${formatDate(r.published_at)}` : "Not synced"}
                        </span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {isLoading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <section>
                  <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                    <Users className="size-3.5 text-slate-400" />
                    Audience comments
                    <span className="ml-auto text-[10px] font-normal text-muted-foreground">{audience.length}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 gap-1 px-2 text-[10px] text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                      disabled={syncingComments}
                      onClick={handleSyncComments}
                    >
                      <RefreshCw className={`size-3 ${syncingComments ? "animate-spin" : ""}`} />
                      {syncingComments ? "Syncing…" : "Sync"}
                    </Button>
                  </h4>
                  {audience.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-xs text-muted-foreground">
                      No audience comments yet.
                    </div>
                  ) : (
                    <ul className="space-y-2.5">
                      {audience.map((c) => (
                        <li key={c.nanoid} className="flex gap-2.5">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-[10px] font-bold text-slate-600">
                            {(c.author_name || "A").split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border bg-card px-3 py-2 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold text-slate-800">{c.author_name || "Anonymous"}</span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(c.published_at)}</span>
                            </div>
                            <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-slate-700">{c.content}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {own.length > 0 && (
                  <section>
                    <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                      <Sparkles className="size-3.5 text-indigo-500" />
                      Your first comments
                      <span className="ml-auto text-[10px] font-normal text-muted-foreground">{own.length}</span>
                    </h4>
                    <ul className="space-y-2.5">
                      {own.map((c) => (
                        <li key={c.nanoid} className="flex gap-2.5">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[10px] font-bold text-white">
                            {(c.author_name || "You").split(/\s+/).map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()}
                          </span>
                          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-indigo-100 bg-indigo-50/50 px-3 py-2 shadow-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium capitalize text-indigo-600">{c.status}</span>
                              <span className="shrink-0 text-[10px] text-muted-foreground">{formatDate(c.published_at)}</span>
                            </div>
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-700">{c.content}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>

          <SheetFooter className="flex-row items-center gap-2 bg-muted/40 sm:justify-between">
            <div className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
              <ExternalLink className="size-3.5 shrink-0" />
              <span className="truncate font-mono">{post?.nanoid}</span>
            </div>
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Main component
 * ────────────────────────────────────────────────────────────────────── */

interface Props {
  channel: ManagedChannel | null;
  posts: ScheduledPost[];
  platforms: SocialMediaPlatform[];
  allPages: ManagedChannel[];
  workspaceDomain: string;
  channelId: string;
}

export function ChannelDetailClient({
  channel,
  posts,
  platforms,
  workspaceDomain,
  channelId,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const basePath = `/${ws}/dashboard/socialmanager`;
  const router = useRouter();

  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{
    created: number;
    skipped: number;
    errors: { page: string; error: string }[];
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [igResult, setIgResult] = useState<{
    page_id: string | null;
    instagram_business_account: { id: string } | null;
    connected: boolean;
  } | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);
  const [revoking, setRevoking] = useState(false);

  const scheduled = useMemo(() => posts.filter((p) => p.status === "scheduled"), [posts]);
  const published = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);
  const drafts = useMemo(() => posts.filter((p) => p.status === "draft"), [posts]);

  const pageById = useMemo<Record<string, ManagedChannel>>(() => {
    if (!channel) return {};
    return { [channel.id]: channel, [channel.nanoid]: channel };
  }, [channel]);

  const handleSync = useCallback(async () => {
    setSyncResult(null);
    setIsSyncing(true);
    try {
      const res = await syncPostsAction({ managed_page: channelId }, ws);
      if ("task_id" in res) setSyncTaskId(res.task_id);
    } finally {
      setIsSyncing(false);
    }
  }, [channelId, ws]);

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
      } catch { /* ignore */ }
    }, 2000);
    return () => clearInterval(iv);
  }, [syncTaskId, ws]);

  const handleGetConnectedInstagram = useCallback(async () => {
    setIgLoading(true);
    try {
      const res = await getConnectedInstagramAction(channelId, ws);
      if (res) setIgResult(res);
    } finally {
      setIgLoading(false);
    }
  }, [channelId, ws]);

  const handleRevoke = useCallback(async () => {
    if (!channel) return;
    setRevoking(true);
    try {
      await revokeAccountAction(channel.social_account, ws);
      router.refresh();
    } finally {
      setRevoking(false);
    }
  }, [channel, ws, router]);

  if (!channel) {
    return (
      <div className="space-y-4">
        <Link
          href={`${basePath}/channels`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="size-3.5" /> Back to channels
        </Link>
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">This channel could not be found or is no longer connected.</p>
        </Card>
      </div>
    );
  }

  const style = getPlatformStyle(channel.platform);
  const token = getTokenStatus(channel.token_expires_at);

  return (
    <div className="space-y-6">
      <Link
        href={`${basePath}/channels`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft className="size-3.5" /> Back to channels
      </Link>

      {/* Channel header */}
      <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {channel.profile_picture_url ? (
              <img
                src={channel.profile_picture_url}
                alt={channel.page_name}
                className="size-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
            ) : (
              <div className="flex size-16 items-center justify-center rounded-2xl bg-slate-100 border border-slate-200 text-base font-bold text-slate-500">
                {channel.page_name?.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 shadow-xs">
              {hasSocialIcon(channel.platform) ? (
                <SocialIcon name={channel.platform} className={`size-5 ${style.color}`} />
              ) : (
                <PlatformGlyph platform={channel.platform} size="md" />
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-xl font-bold text-slate-900">{channel.page_name}</h2>
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${style.bg} ${style.color} ${style.border}`}>
                {style.label}
              </span>
            </div>
            <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
              {channel.username ? `@${channel.username}` : channel.platform_name}
            </p>
            {channel.category && (
              <span className="mt-1.5 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {channel.category}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`${basePath}/analytics`}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50"
          >
            <BarChart3 className="size-4" />
            View Analytics
          </Link>
          <Button
            size="sm"
            onClick={handleSync}
            disabled={isSyncing || !!syncTaskId}
            className="gap-2"
          >
            <RefreshCw className={`size-4 ${isSyncing || syncTaskId ? "animate-spin" : ""}`} />
            {isSyncing || syncTaskId ? "Syncing…" : "Sync from Channel"}
          </Button>
          {channel.platform === "facebook" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetConnectedInstagram}
              disabled={igLoading}
              className="gap-2"
            >
              <SocialIcon name="instagram" className={`size-4 ${igLoading ? "animate-spin" : ""}`} />
              {igLoading ? "Checking…" : "Get Connected Instagram"}
            </Button>
          )}
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Users className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">
                {channel.follower_count ? channel.follower_count.toLocaleString() : "—"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">Followers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{published.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Published</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Clock className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{scheduled.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Scheduled</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <PenLine className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{drafts.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Drafts</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Token health */}
      <Card className="space-y-1.5 p-4 text-xs">
        <div className="flex items-center justify-between text-slate-600">
          <span>Token Health:</span>
          {token.status === "active" ? (
            <span className="flex items-center gap-1 font-medium text-emerald-600">
              <ShieldCheck className="size-3" />
              {token.days !== null ? `Active (${token.days}d left)` : "Active"}
            </span>
          ) : token.status === "expiring_soon" ? (
            <span className="flex items-center gap-1 font-bold text-amber-600">
              <AlertCircle className="size-3" /> Expires in {token.days}d
            </span>
          ) : (
            <span className="flex items-center gap-1 font-medium text-rose-600">
              <Lock className="size-3" /> Token Expired
            </span>
          )}
        </div>
        {channel.updated_at && (
          <div className="flex items-center justify-between text-slate-400">
            <span>Last Synced:</span>
            <span>{formatDate(channel.updated_at)}</span>
          </div>
        )}
      </Card>

      {/* Instagram connection */}
      {igResult && (
        <Card className="p-4">
          <div className="mb-3 flex items-center gap-2">
            <SocialIcon name="instagram" className="size-4 text-pink-600" />
            <h3 className="text-sm font-semibold text-slate-900">Connected Instagram account</h3>
          </div>
          {igResult.connected && igResult.instagram_business_account ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="font-medium text-neutral-700">Page ID:</span>{" "}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{igResult.page_id}</code>
              </p>
              <p>
                <span className="font-medium text-neutral-700">IG Business Account ID:</span>{" "}
                <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs">{igResult.instagram_business_account.id}</code>
              </p>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">No Instagram Business account connected to this page.</p>
          )}
        </Card>
      )}

      {/* Sync result */}
      {syncResult && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            <span className="font-semibold">✓</span>
            Sync complete — {syncResult.created} new, {syncResult.skipped} skipped
            {syncResult.errors.length > 0 && `, ${syncResult.errors.length} failed`}.
          </div>
          {syncResult.errors.map((err, i) => (
            <div key={i} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <span className="font-semibold">{err.page}</span>: {err.error}
            </div>
          ))}
        </div>
      )}

      {/* Posts table */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Posts on this channel
            <span className="ml-2 text-xs font-normal text-slate-400">{posts.length} total</span>
          </h3>
        </div>

        {posts.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <table className="w-full text-left text-sm">
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
                {posts.map((post) => {
                  const media = post.media_image_urls?.[0];
                  return (
                    <tr
                      key={post.nanoid}
                      className="cursor-pointer hover:bg-neutral-50"
                      onClick={() => { setSelectedPost(post); setCommentsSheetOpen(true); }}
                    >
                      <td className="max-w-xs px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {media ? (
                            <img src={media} alt="" className="size-10 shrink-0 rounded-md object-cover" />
                          ) : (
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[10px] font-semibold text-slate-400">
                              TXT
                            </div>
                          )}
                          <span className="line-clamp-2 max-w-[360px] text-sm text-slate-900">
                            {post.content || "No content"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-2">
                          {post.recipients.length > 0 ? (
                            post.recipients.slice(0, 3).map((r) => {
                              const page = pageById[r.managed_page];
                              const platform = (page?.platform || r.managed_page_name).toLowerCase();
                              const ps = getPlatformStyle(platform);
                              return (
                                <span key={r.nanoid} className="flex items-center gap-1.5">
                                  <span className="relative shrink-0">
                                    {page?.profile_picture_url ? (
                                      <img src={page.profile_picture_url} alt="" className="size-8 rounded-full object-cover shadow-md ring-1 ring-black/5" />
                                    ) : (
                                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-slate-500 shadow-md ring-1 ring-black/5">
                                        {r.managed_page_name.slice(0, 1).toUpperCase()}
                                      </span>
                                    )}
                                    <span className={`absolute bottom-0 right-0 flex size-4 translate-x-1/4 translate-y-1/4 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 ${ps.color}`}>
                                      <SocialIconSolid name={platform} className="size-3.5" />
                                    </span>
                                  </span>
                                  <div className="flex flex-col">
                                    <span className="max-w-[140px] truncate text-xs font-medium text-slate-700">
                                      {r.managed_page_name}
                                    </span>
                                    <span className={`text-[10px] capitalize ${ps.color}`}>
                                      {page?.platform || r.managed_page_name}
                                    </span>
                                  </div>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {post.recipients.length > 3 && (
                            <span className="flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              +{post.recipients.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          {post.synced_from_channel && (
                            <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Synced
                            </span>
                          )}
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${STATUS_STYLES[post.status] ?? STATUS_STYLES.draft}`}>
                            {post.status}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {formatDate(post.published_at || post.scheduled_at || post.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-xs text-slate-600" title="Audience comments">
                            <MessageCircle className="size-3.5 text-slate-400" />
                            {post.comments_count ?? 0}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-600" title="Reactions">
                            <Heart className="size-3.5 text-rose-400" />
                            {post.reactions_count ?? 0}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Card className="border-dashed p-6 text-center text-sm text-neutral-500">
            No posts for this channel yet.
          </Card>
        )}
      </div>

      {/* Disconnect */}
      <div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleRevoke}
          disabled={revoking}
          className="gap-2"
        >
          <Unplug className="size-4" />
          {revoking ? "Disconnecting…" : "Disconnect Channel"}
        </Button>
      </div>

      {/* Post comments sheet */}
      <PostCommentsSheet
        post={selectedPost}
        pageById={pageById}
        workspace={ws}
        open={commentsSheetOpen}
        onOpenChange={setCommentsSheetOpen}
      />
    </div>
  );
}
