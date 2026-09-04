"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { useToast } from "@/lib/context/ToastContext";
import { UploadDropzone } from "@/components/media/upload-dropzone";
import { UploadQueue } from "@/components/media/upload-queue";
import { uploadManager, type PersistedUpload } from "@/lib/media/upload-manager";
import type { UploadItem } from "@/lib/media/upload-utils";
import {
  Upload,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatBytes } from "@/lib/media/upload-utils";

function toUploadItem(u: PersistedUpload): UploadItem {
  return {
    id: u.id,
    file: u.file,
    filename: u.filename,
    size: u.size,
    progress: u.progress ?? 0,
    status: u.status,
    error: u.error,
    segments: u.parts?.map((p) => ({
      part_number: p.part_number,
      size: p.size,
      loaded: p.loaded,
      status: p.status,
      attempts: p.attempts,
    })),
    speedBps: u.speedBps,
  };
}

export function MediaUploadCenterClient({
  workspaceDomain,
}: {
  workspaceDomain: string;
}) {
  const router = useRouter();
  const { push: toastError } = useToast();

  // Init the upload manager. The CSRF cookie is already seeded server-side
  // during login (and best-effort via /api/csrf), so we never block upload
  // startup on it. Queued uploads resume immediately.
  useEffect(() => {
    void uploadManager.init();
  }, []);

  const serverSnapshot = useMemo(() => [] as PersistedUpload[], []);
  const uploads = useSyncExternalStore(
    uploadManager.subscribe,
    uploadManager.getSnapshot,
    () => serverSnapshot,
  );
  const items = useMemo(() => uploads.map(toUploadItem), [uploads]);

  const seenFailures = useRef<Set<string> | null>(null);
  useEffect(() => {
    const seen = seenFailures.current;
    if (seen === null) {
      seenFailures.current = new Set(
        items
          .filter((i) => i.status === "failed" && i.error)
          .map((i) => `${i.id}:${i.error}`),
      );
      return;
    }
    for (const item of items) {
      if (item.status === "failed" && item.error) {
        const key = `${item.id}:${item.error}`;
        if (!seen.has(key)) {
          seen.add(key);
          toastError({
            variant: "error",
            title: "Upload failed",
            message: `${item.filename}: ${item.error}`,
          });
        }
      }
    }
  }, [items, toastError]);

  const handleFiles = useCallback(
    (files: File[]) => {
      files.forEach((f) => void uploadManager.enqueue(f, workspaceDomain));
    },
    [workspaceDomain],
  );

  const handleCancel = useCallback((id: string) => {
    void uploadManager.cancel(id);
  }, []);

  const handleRetry = useCallback((id: string) => {
    void uploadManager.retry(id);
  }, []);

  const handleClearCompleted = useCallback(() => {
    void uploadManager.clearCompleted();
  }, []);

  const handleClearFailed = useCallback(() => {
    void uploadManager.clearFailed();
  }, []);

  const handleClearOne = useCallback((id: string) => {
    void uploadManager.clear(id);
  }, []);

  const fileInputRef = useMemo(
    () => ({ current: null as HTMLInputElement | null }),
    [],
  );

  const hasActive = items.some(
    (u) =>
      u.status === "uploading" ||
      u.status === "pending" ||
      u.status === "failed",
  );
  const completedCount = items.filter((u) => u.status === "completed").length;
  const failedCount = items.filter((u) => u.status === "failed").length;
  const uploadingCount = items.filter((u) => u.status === "uploading").length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Upload Center</h1>
          <p className="text-sm text-muted-foreground">
            Drag & drop files, paste from clipboard, or click to upload. Large
            files are sent straight to object storage and keep uploading in the
            background — even if you refresh or leave this page.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${workspaceDomain}/dashboard/media/browser`)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <UploadDropzone
        accept="*/*"
        onFilesSelected={handleFiles}
        rejectExtensions={["avi", "mov", "mkv", "flv", "wmv", "m4v"]}
        onRejected={(rejected) => {
          if (rejected.length) {
            toastError({
              variant: "error",
              title: "Unsupported format",
              message: `Only MP4 and WebM videos are supported. ${rejected.length} file(s) were not uploaded.`,
            });
          }
        }}
        disabled={false}
        className="h-56 border-2"
        fileInputRef={fileInputRef as any}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold">
              Drop files anywhere or click to browse
            </p>
            <p className="text-sm text-muted-foreground">
              Uploads resume automatically after a refresh
            </p>
          </div>
        </div>
      </UploadDropzone>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="default"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Upload more files
        </Button>

        {uploadingCount > 0 && (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {uploadingCount} uploading
          </Badge>
        )}
        {completedCount > 0 && (
          <Badge variant="default" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {completedCount} completed
          </Badge>
        )}
        {failedCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {failedCount} failed
          </Badge>
        )}
        {(completedCount > 0 || failedCount > 0) && (
          <Button
            variant="default"
            size="sm"
            onClick={handleClearCompleted}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="ml-1">
              Clear completed{completedCount > 0 ? ` (${completedCount})` : ""}
            </span>
          </Button>
        )}
        {failedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearFailed}
          >
            <XCircle className="h-3.5 w-3.5" />
            <span className="ml-1">Clear failed</span>
          </Button>
        )}
      </div>

      <UploadQueue
        uploads={items}
        onCancel={handleCancel}
        onRetry={handleRetry}
        onClear={handleClearOne}
      />

      {!hasActive && items.length > 0 && (
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <span>Upload queue idle</span>
        </div>
      )}

      {items.length > 0 && (
        <div className="text-xs text-muted-foreground">
          {items.length} file{items.length > 1 ? "s" : ""} · total{" "}
          {formatBytes(items.reduce((s, u) => s + u.size, 0))}
        </div>
      )}
    </div>
  );
}
