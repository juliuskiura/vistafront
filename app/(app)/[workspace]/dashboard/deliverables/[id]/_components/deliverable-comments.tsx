"use client";

import type { Comment } from "@/lib/api";
import { CommentsPanel } from "../../../projects/_components/comments-panel";

interface Props {
  targetNanoid: string;
  comments: Comment[];
  workspaceDomain: string;
}

/** The deliverable page's comment thread. */
export function DeliverableComments({
  targetNanoid,
  comments,
  workspaceDomain,
}: Props) {
  return (
    <CommentsPanel
      targetType="deliverable"
      targetNanoid={targetNanoid}
      comments={comments}
      workspaceDomain={workspaceDomain}
    />
  );
}
