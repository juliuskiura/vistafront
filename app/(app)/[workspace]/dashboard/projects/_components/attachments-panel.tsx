"use client";

import { useActionState, useState } from "react";

import type { Attachment } from "@/lib/api";
import { formatMediumDateTime } from "@/lib/dates";
import { Download, Paperclip, Trash2 } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  deleteAttachmentAction,
  uploadAttachmentAction,
} from "../actions/attachment-actions";
import { initialProjectActionState } from "../action-state";

interface Props {
  /** The backend's short model name for the record the files hang off. */
  targetType: "project" | "task";
  targetNanoid: string;
  attachments: Attachment[];
  workspaceDomain: string;
  title?: string;
}

/** A readable size for the file list. */
function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * The attachment list.
 *
 * The upload is multipart, so it goes through a Server Action rather than
 * the JSON-only API base; the file travels in the form as a `File` and is
 * posted as multipart under the hood.
 */
export function AttachmentsPanel({
  targetType,
  targetNanoid,
  attachments,
  workspaceDomain,
  title = "Attachments",
}: Props) {
  const [state, formAction, pending] = useActionState(
    uploadAttachmentAction,
    initialProjectActionState,
  );
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // The upload succeeded, so the file input (which React resets on its
  // own after a form action) no longer holds anything — drop the hint
  // with it. Adjusting during render avoids a second paint.
  const [lastStatus, setLastStatus] = useState(state.status);
  if (state.status !== lastStatus) {
    setLastStatus(state.status);
    if (state.status === "success") setFileName(null);
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>

      {attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files attached yet.</p>
      ) : (
        <ul className="space-y-2">
          {attachments.map((attachment) => (
            <li
              key={attachment.nanoid}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <Paperclip
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {attachment.original_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(attachment.size)} ·{" "}
                  {attachment.uploaded_by_name ?? "Someone"} ·{" "}
                  {formatMediumDateTime(attachment.created_at)}
                </p>
              </div>
              <a
                href={`/api/projectmanager/attachments/${attachment.nanoid}/file?workspace=${encodeURIComponent(
                  workspaceDomain,
                )}`}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label={`Download ${attachment.original_name}`}
              >
                <Download className="size-4" aria-hidden="true" />
              </a>
              <Button
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteTarget(attachment)}
                aria-label={`Remove ${attachment.original_name}`}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {error ? (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <form action={formAction} className="space-y-2">
        <input type="hidden" name="workspace_domain" value={workspaceDomain} />
        <input type="hidden" name="target_type" value={targetType} />
        <input type="hidden" name="target_nanoid" value={targetNanoid} />

        <div className="flex flex-wrap items-center gap-2">
          <input
            id="attachment-file"
            type="file"
            name="file"
            onChange={(event) =>
              setFileName(event.target.files?.[0]?.name ?? null)
            }
            className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
          <Button type="submit" size="sm" disabled={pending}>
            <Paperclip className="size-4" aria-hidden="true" />
            {pending ? "Uploading…" : "Attach file"}
          </Button>
        </div>

        {fileName ? (
          <p className="text-xs text-muted-foreground">Ready: {fileName}</p>
        ) : null}

        {state.status === "error" && state.message ? (
          <p className="text-xs text-destructive">{state.message}</p>
        ) : null}
      </form>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Remove this file?"
        description={`“${deleteTarget?.original_name}” will be removed from this record. This cannot be undone.`}
        confirmLabel="Remove file"
        variant="destructive"
        onConfirm={async () => {
          if (!deleteTarget) return;
          const result = await deleteAttachmentAction({
            workspaceDomain,
            nanoid: deleteTarget.nanoid,
          });
          if (result.status === "error") {
            setError(result.message ?? "The file could not be removed.");
          }
        }}
      />
    </div>
  );
}
