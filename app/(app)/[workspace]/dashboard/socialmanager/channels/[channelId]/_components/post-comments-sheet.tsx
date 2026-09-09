"use client";

import { Clock, CloudDownload, ExternalLink, Heart, MessageCircle, Send, Sparkles } from "lucide-react";

import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";
import { getPlatformStyle } from "@/components/platform-icon";
import { SocialIconSolid } from "@/components/social-icons";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatDate, getPlatformGradient, STATUS_META } from "./platform-gradients";
import { PostCommentsBody } from "./post-comments-body";

interface PostCommentsSheetProps {
  post: ScheduledPost | null;
  pageById: Record<string, ManagedChannel>;
  workspace: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostCommentsSheet({
  post,
  pageById,
  workspace,
  open,
  onOpenChange,
}: PostCommentsSheetProps) {
  const recipients = post?.recipients ?? [];
  const primaryRecipient = recipients[0];
  const primaryPage = primaryRecipient ? pageById[primaryRecipient.managed_page] : undefined;
  const primaryPlatform = (primaryPage?.platform ?? "").toLowerCase();
  const statusMeta = post ? STATUS_META[post.status] ?? STATUS_META.draft : STATUS_META.draft;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-hidden p-0 sm:max-w-lg">
        <div className="flex h-full flex-col">
          <div className={`relative bg-gradient-to-br ${getPlatformGradient(primaryPlatform)}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_55%)]" />
            <SheetHeader className="relative border-none bg-transparent p-5 text-white">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
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
                        <img
                          src={page.profile_picture_url}
                          alt=""
                          className="size-9 rounded-full object-cover ring-1 ring-black/5"
                        />
                      ) : (
                        <span className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-bold text-slate-500 ring-1 ring-black/5">
                          {r.managed_page_name.slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5 ${style.color}`}
                      >
                        <SocialIconSolid name={platform} className="size-2.5" />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {r.managed_page_name}
                      </span>
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
            {post && <PostCommentsBody key={post.nanoid} post={post} workspace={workspace} />}
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