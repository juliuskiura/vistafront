/**
 * Client-side pre-flight screening for attachment uploads.
 *
 * Plain module, deliberately NOT `"use server"`: that directive requires every
 * export to be an async function, and these are pure helpers. They also need to
 * be importable from a Client Component.
 *
 * This is a courtesy check only — it saves a slow round-trip and a confusing
 * server error. It is not a security control: anyone can call the endpoint
 * directly, so `mailbox.attachments.validate_attachment` is what actually
 * enforces the limit and the deny list.
 */

/** Mirrors `mailbox.attachments.MAX_ATTACHMENT_BYTES` on the server. */
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;

/** Server-side deny list, kept in step with `mailbox/attachments.py`. */
export const BLOCKED_EXTENSIONS = [
  ".html", ".htm", ".xhtml", ".svg", ".xml", ".js", ".mjs", ".cjs",
  ".sh", ".bash", ".exe", ".dll", ".com", ".bat", ".cmd", ".ps1",
  ".msi", ".scr", ".jar", ".vbs", ".wsf", ".hta", ".phtml", ".svgz",
];

export interface UploadRejection {
  filename: string;
  reason: string;
}

export function screenFiles(files: File[]): {
  accepted: File[];
  rejected: UploadRejection[];
} {
  const accepted: File[] = [];
  const rejected: UploadRejection[] = [];

  for (const file of files) {
    const dot = file.name.lastIndexOf(".");
    const ext = dot > -1 ? file.name.slice(dot).toLowerCase() : "";

    if (!file.name || !ext) {
      rejected.push({
        filename: file.name || "file",
        reason: "Missing a file extension.",
      });
    } else if (file.size > MAX_ATTACHMENT_BYTES) {
      rejected.push({
        filename: file.name,
        reason: `Larger than the ${MAX_ATTACHMENT_BYTES / (1024 * 1024)} MB limit.`,
      });
    } else if (BLOCKED_EXTENSIONS.includes(ext)) {
      rejected.push({
        filename: file.name,
        reason: `Files of type "${ext}" cannot be attached.`,
      });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, rejected };
}

/** "1.4 MB" — the size shown on an attachment chip. */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
