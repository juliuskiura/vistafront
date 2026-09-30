"use client";

import { useRef, useState } from "react";

import { Paperclip, X } from "@/lib/icons";
import {
  formatFileSize,
  screenFiles,
  type UploadRejection,
} from "@/lib/mailbox/attachment-rules";

interface PendingFile {
  key: string;
  file: File;
}

interface AttachmentPickerProps {
  /** Named `attachments` so the Server Action receives it in its own FormData. */
  name?: string;
  disabled?: boolean;
}

/**
 * File picker for the compose form.
 *
 * The files live in local component state and are written into a hidden
 * `<input type="file" multiple>`-backed form field, so the whole form still
 * posts to a Server Action as a normal form submission — including the
 * `File` objects, which a Server Action receives as `File` instances. Nothing
 * is uploaded from the browser.
 *
 * `screenFiles` is a pre-flight only; the server enforces the real limit.
 */
export function AttachmentPicker({
  name = "attachments",
  disabled = false,
}: AttachmentPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [rejected, setRejected] = useState<UploadRejection[]>([]);
  const [dragging, setDragging] = useState(false);

  /**
   * Mirror the pending list back into the input's own `FileList`.
   *
   * The `<input type="file">` is what the browser serialises into the form's
   * FormData, so removing a chip that only edited React state would leave the
   * file still attached at submit time. A DataTransfer is the only way to
   * rewrite `input.files`.
   */
  function syncInput(next: PendingFile[]) {
    const input = inputRef.current;
    if (!input) return;
    const dt = new DataTransfer();
    for (const { file } of next) dt.items.add(file);
    input.files = dt.files;
  }

  function add(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    const { accepted, rejected: bad } = screenFiles(Array.from(incoming));
    setRejected(bad);
    setFiles((prev) => {
      const seen = new Set(prev.map((p) => `${p.file.name}:${p.file.size}`));
      const fresh = accepted.filter((f) => !seen.has(`${f.name}:${f.size}`));
      const next = [
        ...prev,
        ...fresh.map((f) => ({ key: `${f.name}:${f.size}`, file: f })),
      ];
      syncInput(next);
      return next;
    });
  }

  function remove(key: string) {
    setFiles((prev) => {
      const next = prev.filter((f) => f.key !== key);
      syncInput(next);
      return next;
    });
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          add(e.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed transition-colors ${
          dragging
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/30 hover:border-primary/40 hover:bg-muted/50"
        }`}
      >
        <label
          className={`flex cursor-pointer items-center justify-center gap-2 px-4 py-3 text-xs ${
            disabled ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <Paperclip className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <span className="text-muted-foreground">
            <span className="font-medium text-primary underline-offset-2 hover:underline">
              Choose files
            </span>{" "}
            or drop them here
          </span>
          <input
            ref={inputRef}
            type="file"
            name={name}
            multiple
            disabled={disabled}
            onChange={(e) => {
              add(e.target.files);
              // Reset so re-picking the same file fires `change` again.
              e.target.value = "";
            }}
            className="sr-only"
          />
        </label>
      </div>

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {files.map(({ key, file }) => (
            <li
              key={key}
              className="group flex max-w-[240px] items-center gap-2 rounded-lg border border-border bg-card py-1.5 pl-2.5 pr-1.5 text-xs shadow-xs"
            >
              <Paperclip
                className="h-3 w-3 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="truncate text-foreground">{file.name}</span>
              <span className="shrink-0 text-muted-foreground">
                {formatFileSize(file.size)}
              </span>
              <button
                type="button"
                onClick={() => remove(key)}
                aria-label={`Remove ${file.name}`}
                className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {rejected.length > 0 && (
        <ul className="space-y-1" role="alert">
          {rejected.map((r) => (
            <li key={r.filename} className="text-xs text-destructive">
              {r.filename}: {r.reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
