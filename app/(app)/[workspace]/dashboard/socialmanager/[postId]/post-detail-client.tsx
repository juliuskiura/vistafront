"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import type { ManagedChannel, MetricSnapshot, ScheduledPost } from "@/lib/api/types";
import {
  ArrowLeft,
  ChevronRight,
  Rss,
  AlertTriangle,
  RefreshCw,
} from "@/lib/icons";
import { usePlatformBrand } from "@/lib/social/platform-brand-context";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { retryAvailability } from "@/lib/social/delivery-error";
import { usePostActions } from "./use-post-actions";

import { FeedHeader } from "../feed/_components/feed-header";
import { CaptionWithHashtags } from "../feed/_components/feed-caption";
import { FeedMedia } from "../feed/_components/feed-media";
import { FeedRecipientRows } from "../feed/_components/feed-recipient-rows";
import { FeedComments } from "../feed/_components/feed-comments";

import { NewCommentBox } from "./_components/new-comment-box";
import { MetaPanel } from "./_components/meta-panel";
import { PostActionsMenu } from "./_components/post-actions-menu";
import { EngagementKPIs } from "./_components/engagement-kpis";
import { MetricChart } from "./_components/metric-chart";
import { LiveRecipients, isLiveCopy } from "./_components";

interface Props {
  post: ScheduledPost;
  metrics: MetricSnapshot[];
  metricsChannels?: { nanoids: string[]; omitted: number };
  workspaceDomain: string;
  pages: ManagedChannel[];
}

/** Post detail page: a single parent post laid out as a feed card, with the
 *  always-open comment thread beside the meta rail and full-width metrics below. */
export function PostDetailClient({
  post: initialPost,
  metrics,
  metricsChannels,
  workspaceDomain,
  pages,
}: Props) {
  const { brandOf } = usePlatformBrand();

  /* One lookup per name: Record for the feed components, Map for LiveRecipients. */
  const pagesById = useMemo(() => {
    const byId: Record<string, ManagedChannel> = {};
    for (const page of pages) byId[page.nanoid] = page;
    return byId;
  }, [pages]);

  const pageByNanoid = useMemo(
    () => new Map(pages.map((p) => [p.nanoid, p] as const)),
    [pages],
  );

  /* One logo per *brand* reached — three Instagram channels are one Instagram
     icon, not three — so the strip reads as "which networks" the post went to. */
  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          initialPost.recipients
            .map((r) => brandOf(pagesById[r.managed_page]?.platform))
            .filter((b): b is string => Boolean(b)),
        ),
      ),
    [initialPost.recipients, pagesById, brandOf],
  );

  /* What the engagement numbers mean: snapshots are per channel. */
  const metricsScope = useMemo(() => {
    const names = (metricsChannels?.nanoids ?? []).map(
      (nanoid) => pagesById[nanoid]?.page_name ?? "a channel",
    );
    return {
      names,
      omitted: metricsChannels?.omitted ?? 0,
      has: Boolean(metricsChannels?.nanoids.length),
    };
  }, [metricsChannels, pagesById]);

  const [post, setPost] = useState<ScheduledPost>(initialPost);
  const {
    error,
    notice,
    pendingAction,
    deleteDialogOpen,
    setDeleteDialogOpen,
    requestAction,
    executeAction,
    refreshPost,
  } = usePostActions(workspaceDomain, post, setPost);

  const retryCheck = retryAvailability(post);
  const retryBlockedReason = retryCheck.available ? null : retryCheck.reason;
  const liveCopies = post.recipients.filter(isLiveCopy);
  const basePath = `/${workspaceDomain}/dashboard/socialmanager`;

  return (
    <div className="mx-auto max-w-5xl">
      {/* ── Breadcrumb + overflow actions ── */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            href={basePath}
            className="inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <ChevronRight className="size-3.5 text-neutral-400" />
          <span className="font-medium text-neutral-900">Post detail</span>
          <Link
            href={`${basePath}/feed?post=${post.nanoid}`}
            className="ml-2 inline-flex items-center gap-1 rounded-full border border-neutral-200 px-2.5 py-1 text-xs font-medium text-neutral-600 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
          >
            <Rss className="size-3.5" />
            View Unified Feed
          </Link>
        </div>
        <PostActionsMenu
          post={post}
          onAction={requestAction}
          hasFailedRecipients={retryCheck.available}
        />
      </div>

      {/* ── Status banners ── */}
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          <AlertTriangle className="mr-1 inline size-4" />
          {error}
        </div>
      )}
      {notice && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          <RefreshCw className="mr-1 inline size-4" />
          {notice}
        </div>
      )}

      {/* ── Feed-style two-column grid ── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        {/* ── Left column: single feed card + always-open thread ── */}
        <div className="min-w-0 space-y-4">
          {/* The feed card — identical header / caption / media / recipients. */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-xs sm:p-5">
            <FeedHeader post={post} brands={brands} status={post.status} />

            <div className="mt-3">
              <CaptionWithHashtags
                text={post.content?.trim() || "No content"}
                className="text-sm leading-relaxed whitespace-pre-wrap break-words text-neutral-800"
              />
              <FeedMedia post={post} />
            </div>

            {post.recipients.length > 0 && (
              <FeedRecipientRows
                recipients={post.recipients}
                pagesById={pagesById}
                workspace={workspaceDomain}
              />
            )}
          </div>

          {/* ── Comment thread: always open, no toggle ── */}
          <NewCommentBox
            recipients={post.recipients}
            pagesById={pagesById}
            workspaceDomain={workspaceDomain}
            onQueued={refreshPost}
          />
          <FeedComments
            post={post}
            workspace={workspaceDomain}
            pagesById={pagesById}
          />
        </div>

        {/* ── Right rail: meta / outcomes / actions / live copies ── */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <MetaPanel
            post={post}
            recipients={post.recipients}
            pendingAction={pendingAction}
            retryBlockedReason={retryBlockedReason}
            hasFailedRecipients={retryCheck.available}
            onAction={requestAction}
          />

          <LiveRecipients
            recipients={post.recipients}
            workspace={workspaceDomain}
            pageByNanoid={pageByNanoid}
            onChanged={refreshPost}
          />
        </aside>
      </div>

      {/* ── Metrics: full-width below the grid ── */}
      {metricsScope.has ? (
        <div className="mt-6 space-y-6">
          <EngagementKPIs post={post} metrics={metrics} />
          <MetricChart
            metrics={metrics}
            channelNames={metricsScope.names}
            omittedChannels={metricsScope.omitted}
          />
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-neutral-200 bg-neutral-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-neutral-700">
            No channel metrics yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-sm text-neutral-500">
            Impressions, reach and clicks are reported by the platform per
            channel, so they appear once a channel has sent its first snapshot.
            Reactions and comments on this post are counted above.
          </p>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={liveCopies.length ? "Delete this post everywhere?" : "Delete this post?"}
        description={
          liveCopies.length
            ? `This removes the post from ${liveCopies.length} published page${liveCopies.length === 1 ? "" : "s"}, then deletes it. This action cannot be undone.`
            : "This permanently deletes the post from VistaSolve. Anything already live on a channel is not removed by this. This action cannot be undone."
        }
        confirmLabel="Delete"
        variant="destructive"
        confirming={pendingAction === "delete"}
        onConfirm={() => void executeAction("delete")}
      />
    </div>
  );
}
