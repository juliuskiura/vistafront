"use client";

import type { Comment } from "@/lib/api";
import { CommentsPanel } from "../../../_components/comments-panel";

interface Props {
  targetNanoid: string;
  comments: Comment[];
  workspaceDomain: string;
}

/** The task page's comment thread. */
export function TaskComments({
  targetNanoid,
  comments,
  workspaceDomain,
}: Props) {
  return (
    <CommentsPanel
      targetType="task"
      targetNanoid={targetNanoid}
      comments={comments}
      workspaceDomain={workspaceDomain}
    />
  );
}
