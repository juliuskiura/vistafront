"use client";

import { Heart, MessageCircle, Newspaper } from "lucide-react";

import type { ManagedChannel, ScheduledPost } from "@/lib/api/types";
import { getPlatformStyle } from "@/components/platform-icon";
import { SocialIconSolid } from "@/components/social-icons";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDate, STATUS_STYLES } from "./platform-gradients";

interface ChannelPostsProps {
  posts: ScheduledPost[];
  pageById: Record<string, ManagedChannel>;
  onOpenPost: (post: ScheduledPost) => void;
}

export function ChannelPosts({ posts, pageById, onOpenPost }: ChannelPostsProps) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
          <Newspaper className="size-4 text-slate-400" />
          Posts on this channel
          <span className="ml-2 text-xs font-normal text-slate-400">{posts.length} total</span>
        </h3>
      </div>

      {posts.length > 0 ? (
        <Card className="overflow-hidden rounded-2xl p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-muted/40 text-xs font-medium text-neutral-500">
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
                  const media = post.media_image_urls?.[0] || post.media_urls?.[0];
                  return (
                    <tr
                      key={post.nanoid}
                      className="cursor-pointer transition-colors hover:bg-muted/40"
                      onClick={() => onOpenPost(post)}
                    >
                      <td className="max-w-xs px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          {media ? (
                            <img
                              src={media}
                              alt=""
                              className="size-11 shrink-0 rounded-lg object-cover ring-1 ring-black/5"
                            />
                          ) : (
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] font-semibold text-slate-400">
                              TXT
                            </div>
                          )}
                          <span className="line-clamp-2 max-w-[360px] text-sm text-slate-900">
                            {post.content || "No content"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          {post.recipients.length > 0 ? (
                            post.recipients.slice(0, 3).map((r) => {
                              const page = pageById[r.managed_page];
                              const platform = (page?.platform || r.managed_page_name).toLowerCase();
                              const ps = getPlatformStyle(platform);
                              return (
                                <span key={r.nanoid} className="flex items-center gap-1.5">
                                  <span className="relative shrink-0">
                                    {page?.profile_picture_url ? (
                                      <img
                                        src={page.profile_picture_url}
                                        alt=""
                                        className="size-8 rounded-full object-cover shadow-md ring-1 ring-black/5"
                                      />
                                    ) : (
                                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-slate-500 shadow-md ring-1 ring-black/5">
                                        {r.managed_page_name.slice(0, 1).toUpperCase()}
                                      </span>
                                    )}
                                    <span
                                      className={cn(
                                        "absolute bottom-0 right-0 flex size-4 translate-x-1/4 translate-y-1/4 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/5",
                                        ps.color,
                                      )}
                                    >
                                      <SocialIconSolid name={platform} className="size-3.5" />
                                    </span>
                                  </span>
                                  <span className="hidden max-w-[120px] truncate text-xs font-medium text-slate-700 lg:block">
                                    {r.managed_page_name}
                                  </span>
                                </span>
                              );
                            })
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                          {post.recipients.length > 3 && (
                            <span className="flex items-center rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-slate-400">
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
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize",
                              STATUS_STYLES[post.status] ?? STATUS_STYLES.draft,
                            )}
                          >
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
        </Card>
      ) : (
        <Card className="rounded-2xl border-dashed p-6 text-center text-sm text-neutral-500">
          No posts for this channel yet.
        </Card>
      )}
    </div>
  );
}