import { nanoid } from "nanoid";
import type { ComponentType } from "react";

export type UploadItemStatus =
  | "pending"
  | "uploading"
  | "completed"
  | "failed"
  | "cancelled";

export interface UploadSegment {
  part_number: number;
  size: number;
  loaded: number;
  status: "pending" | "uploading" | "retrying" | "done" | "failed";
  attempts: number;
}

export interface UploadItem {
  id: string;
  file: File;
  filename: string;
  size: number;
  progress: number;
  status: UploadItemStatus;
  error?: string;
  segments?: UploadSegment[];
  speedBps?: number;
}

export type FileTypeCategory =
  | "image"
  | "video"
  | "audio"
  | "document"
  | "archive"
  | "other";

const ASSET_TYPE_ICONS: Record<FileTypeCategory, ComponentType<{ className?: string }>> = {
  image: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  video: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  audio: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  document: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  archive: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 01-2-2V4a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  other: (props) => (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

export function getAssetTypeIcon(
  assetType: string | FileTypeCategory,
): ComponentType<{ className?: string }> {
  return ASSET_TYPE_ICONS[assetType as FileTypeCategory] ?? ASSET_TYPE_ICONS.other;
}

export function getFileIcon(
  category: FileTypeCategory,
): ComponentType<{ className?: string }> {
  return getAssetTypeIcon(category);
}

export function createUploadItem(file: File): UploadItem {
  return {
    id: nanoid(),
    file,
    filename: file.name,
    size: file.size,
    progress: 0,
    status: "pending",
  };
}

export function formatBytes(bytes: number, fraction = 1): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  return `${Number((bytes / Math.pow(1024, i)).toFixed(fraction))} ${units[i]}`;
}

export function getFileTypeCategory(file: File): FileTypeCategory {
  if (file.type) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    if (file.type.startsWith("audio/")) return "audio";
  }
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext) return "other";
  if (
    [
      "pdf",
      "doc",
      "docx",
      "xls",
      "xlsx",
      "ppt",
      "pptx",
      "txt",
      "csv",
      "rtf",
      "odt",
      "ods",
      "odp",
      "md",
      "json",
      "xml",
      "html",
      "css",
    ].includes(ext)
  ) {
    return "document";
  }
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "tgz"].includes(ext)) {
    return "archive";
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp", "tiff", "avif", "heic"].includes(ext)) {
    return "image";
  }
  if (["mp4", "webm", "avi", "mov", "mkv", "flv", "wmv", "m4v"].includes(ext)) {
    return "video";
  }
  if (["mp3", "wav", "ogg", "flac", "m4a", "aac", "wma"].includes(ext)) {
    return "audio";
  }
  return "other";
}

export async function computeSha256(blob: Blob): Promise<string> {
  try {
    const buf = await new Response(blob).arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buf);
    const bytes = Array.from(new Uint8Array(hash));
    return bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return "";
  }
}
