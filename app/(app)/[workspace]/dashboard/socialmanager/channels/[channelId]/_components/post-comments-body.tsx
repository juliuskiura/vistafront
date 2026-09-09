"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Sparkles, Users } from "lucide-react";

import type { PostComment, ScheduledPost } from "@/lib/api/types";
import { getPostsSyncStatusAction, listPostCommentsAction, syncCommentsAction } from "../../../actions";
import { Button } from "@/components/ui/button";
import { formatDate } from "./platform-gradients";

interface PostCommentsBodyProps {
  post: ScheduledPost;
  workspace: string;
}

export function PostCommentsBody({ post, workspace }: PostCommentsBodyProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentSyncTask, setCommentSyncTask] = useState<string | null>(null);
  const [syncingComments, setSyncingComments] = useState(false);

  useEffect(() => {
    let cancelled = false;
    listPostCommentsAction(post.nanoid, workspace)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [post, workspace]);

  useEffect(() => {
    if (!commentSyncTask) return;
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
      } catch {
        /* ignore */
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, [commentSyncTask, post, workspace]);

  const handleSyncComments = async () => {
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

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    );
  }

  return (
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
                  {(c.author_name || "A")
                    .split(/\s+/)
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border bg-card px-3 py-2 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-semibold text-slate-800">
                      {c.author_name || "Anonymous"}
                    </span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatDate(c.published_at)}
                    </span>
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
                  {(c.author_name || "You")
                    .split(/\s+/)
                    .map((p) => p[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </span>
                <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm border border-indigo-100 bg-indigo-50/50 px-3 py-2 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium capitalize text-indigo-600">
                      {c.status}
                    </span>
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
  );
}