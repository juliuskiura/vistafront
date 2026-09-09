"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Unlink } from "lucide-react";

import type { ManagedChannel, ScheduledPost, SocialMediaPlatform } from "@/lib/api/types";
import {
  getConnectedInstagramAction,
  getPostsSyncStatusAction,
  syncPostsAction,
} from "../../actions";
import { Card } from "@/components/ui/card";
import { ChannelHero } from "./_components/channel-hero";
import { ChannelStats } from "./_components/channel-stats";
import { ChannelHealth } from "./_components/channel-health";
import { ChannelAbout } from "./_components/channel-about";
import { ChannelPosts } from "./_components/channel-posts";
import { ChannelActions, type InstagramResult, type SyncResult } from "./_components/channel-actions";
import { PostCommentsSheet } from "./_components/post-comments-sheet";
import { getTokenHealth } from "./_components/platform-gradients";

interface Props {
  channel: ManagedChannel | null;
  posts: ScheduledPost[];
  platforms: SocialMediaPlatform[];
  allPages: ManagedChannel[];
  workspaceDomain: string;
  channelId: string;
  pageToAccountNanoid: Record<string, string>;
}

export function ChannelDetailClient({
  channel,
  posts,
  platforms,
  allPages,
  workspaceDomain,
  channelId,
  pageToAccountNanoid,
}: Props) {
  const ws = workspaceDomain.toLowerCase();
  const basePath = `/${ws}/dashboard/socialmanager`;

  const [syncTaskId, setSyncTaskId] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [igResult, setIgResult] = useState<InstagramResult | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ScheduledPost | null>(null);
  const [commentsSheetOpen, setCommentsSheetOpen] = useState(false);

  const scheduled = useMemo(() => posts.filter((p) => p.status === "scheduled"), [posts]);
  const published = useMemo(() => posts.filter((p) => p.status === "published"), [posts]);
  const drafts = useMemo(() => posts.filter((p) => p.status === "draft"), [posts]);

  const pageById = useMemo<Record<string, ManagedChannel>>(() => {
    const map: Record<string, ManagedChannel> = {};
    for (const page of allPages) {
      map[page.id] = page;
      map[page.nanoid] = page;
    }
    return map;
  }, [allPages]);

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
      } catch {
        /* ignore */
      }
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

  const handleOpenPost = useCallback((post: ScheduledPost) => {
    setSelectedPost(post);
    setCommentsSheetOpen(true);
  }, []);

  if (!channel) {
    return (
      <div className="space-y-4">
        <Link
          href={`${basePath}/channels`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="size-3.5" /> Back to channels
        </Link>
        <Card className="flex flex-col items-center gap-3 p-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
            <Unlink className="size-6" />
          </div>
          <p className="text-sm text-muted-foreground">
            This channel could not be found or is no longer connected.
          </p>
        </Card>
      </div>
    );
  }

  const token = getTokenHealth(channel.token_expires_at);
  const isSyncingPending = isSyncing || !!syncTaskId;

  return (
    <div className="space-y-6">
      <Link
        href={`${basePath}/channels`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
      >
        <ArrowLeft className="size-3.5" /> Back to channels
      </Link>

      <ChannelHero
        channel={channel}
        token={token}
        isSyncing={isSyncingPending}
        isActive={channel.is_active}
        igLoading={igLoading}
        onSync={handleSync}
        onGetInstagram={handleGetConnectedInstagram}
        basePath={basePath}
        platforms={platforms}
      />

      <ChannelStats
        followerCount={channel.follower_count}
        published={published.length}
        scheduled={scheduled.length}
        drafts={drafts.length}
      />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <ChannelHealth token={token} lastSynced={channel.updated_at} />
        </div>
        <div className="lg:col-span-3">
          <ChannelAbout channel={channel} />
        </div>
      </div>

      <ChannelActions
        syncResult={syncResult}
        igResult={igResult}
        pageToAccountNanoid={pageToAccountNanoid}
        workspaceDomain={workspaceDomain}
        channelId={channelId}
      />

      <ChannelPosts
        posts={posts}
        pageById={pageById}
        onOpenPost={handleOpenPost}
      />

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