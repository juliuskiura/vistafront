"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import type { ScheduledPost } from "@/lib/api/types";
import {
  publishPostAction,
  retryPostAction,
  cancelPostAction,
  deletePostAction,
  duplicatePostAction,
  getPostAction,
} from "../actions";
import { waitForLiveTask, retryOutcome } from "./_components";

export interface PostActionResult {
  error: string | null;
  notice: string | null;
  pendingAction: string | null;
  deleteDialogOpen: boolean;
  setDeleteDialogOpen: (v: boolean) => void;
  requestAction: (action: string) => void;
  executeAction: (action: string) => Promise<void>;
  refreshPost: () => Promise<void>;
}

/**
 * Centralises every mutation path on the post detail page: edit, duplicate,
 * view, share, cancel, retry, publish, delete.
 *
 * State (error / notice / pending) lives here so the component body stays
 * focused on rendering. The `post` argument is the latest snapshot — every
 * handler re-reads from it so a stale closure can never publish the wrong ID.
 */
export function usePostActions(
  workspaceDomain: string,
  post: ScheduledPost,
  onPostChanged: (post: ScheduledPost) => void,
): PostActionResult {
  const router = useRouter();
  const basePath = `/${workspaceDomain}/dashboard/socialmanager`;

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const refreshPost = useCallback(async () => {
    const fresh = await getPostAction(post.nanoid, workspaceDomain);
    if (fresh) onPostChanged(fresh);
  }, [post.nanoid, workspaceDomain, onPostChanged]);

  const handleAction = useCallback(
    async (action: string) => {
      setError(null);
      setNotice(null);
      if (pendingAction !== null && (action === "retry" || action === "publish")) return;
      if (action === "retry" || action === "publish") {
        const hasMedia = (post.media_image_urls?.length || post.media_urls?.length || 0) > 0;
        if (!post.content?.trim() && !hasMedia) {
          setError("This post has no caption and no media to publish. Add one first.");
          return;
        }
      }
      setPendingAction(action);
      try {
        switch (action) {
          case "edit":
            router.push(`${basePath}/compose?edit=${post.nanoid}`);
            break;
          case "duplicate": {
            const res = await duplicatePostAction(post.nanoid, workspaceDomain);
            if ("post" in res) router.push(`${basePath}/${res.post.nanoid}`);
            break;
          }
          case "view": {
            const url = post.recipients[0]?.link_url;
            if (url) window.open(url, "_blank");
            break;
          }
          case "share":
            await navigator.clipboard.writeText(
              `${window.location.origin}/${workspaceDomain}/dashboard/socialmanager/${post.nanoid}`,
            );
            break;
          case "cancel": {
            const res = await cancelPostAction(post.nanoid, workspaceDomain);
            if ("post" in res) onPostChanged(res.post);
            break;
          }
          case "retry": {
            const res = await retryPostAction(post.nanoid, workspaceDomain);
            if (res.status === "success" && "post" in res) {
              onPostChanged(res.post);
              setNotice(retryOutcome(res.post));
            } else if (res.status === "error") {
              setError(res.message || "Retry failed.");
            }
            break;
          }
          case "publish": {
            const res = await publishPostAction(post.nanoid, workspaceDomain);
            if (res.status === "error") setError(res.message || "Failed to publish post.");
            else if ("post" in res) onPostChanged(res.post);
            break;
          }
          case "delete": {
            const res = await deletePostAction(post.nanoid, workspaceDomain);
            if (res.status === "error") {
              setDeleteDialogOpen(false);
              setError(res.message || "Failed to delete post.");
              break;
            }
            if (!res.task_id) {
              setDeleteDialogOpen(false);
              router.push(`${basePath}`);
              break;
            }
            setPendingAction(null);
            const outcome = await waitForLiveTask(res.task_id, workspaceDomain);
            setDeleteDialogOpen(false);
            if (!outcome.ok) {
              setError(outcome.failure);
              await refreshPost();
              break;
            }
            router.push(`${basePath}`);
            break;
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed");
      } finally {
        setPendingAction(null);
      }
    },
    [post, workspaceDomain, router, basePath, pendingAction, onPostChanged, refreshPost],
  );

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

  return {
    error,
    notice,
    pendingAction,
    deleteDialogOpen,
    setDeleteDialogOpen,
    requestAction,
    executeAction: handleAction,
    refreshPost,
  };
}
