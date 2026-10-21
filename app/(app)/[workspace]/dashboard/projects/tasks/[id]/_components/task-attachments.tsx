"use client";

import type { Attachment } from "@/lib/api";
import { AttachmentsPanel } from "../../../_components/attachments-panel";

interface Props {
  targetNanoid: string;
  attachments: Attachment[];
  workspaceDomain: string;
}

/** The task page's file list. */
export function TaskAttachments({
  targetNanoid,
  attachments,
  workspaceDomain,
}: Props) {
  return (
    <AttachmentsPanel
      targetType="task"
      targetNanoid={targetNanoid}
      attachments={attachments}
      workspaceDomain={workspaceDomain}
    />
  );
}
