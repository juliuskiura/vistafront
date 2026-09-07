"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud, Loader2, CheckCircle2, XCircle, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type DirectVideoStage = "idle" | "uploading" | "processing" | "published" | "rejected" | "failed";

export interface DirectVideoUploadOptions {
  caption?: string;
  title?: string;
  managedPage?: string;
  onStage?: (stage: DirectVideoStage) => void;
  signal?: AbortSignal;
}

export interface DirectVideoUploadResult {
  status: "published" | "rejected" | "failed";
  videoId?: string;
  error?: string;
}

const UPLOAD_URL = "/apis/socialmanager/reels/upload/";
const statusUrl = (taskId: string) => `/apis/socialmanager/reels/status/${taskId}/`;

async function uploadVideoDirect(
  file: File,
  opts: DirectVideoUploadOptions = {},
  workspaceDomain: string,
): Promise<DirectVideoUploadResult> {
  const form = new FormData();
  form.append("file", file);
  if (opts.caption) form.append("caption", opts.caption);
  if (opts.title) form.append("title", opts.title);
  if (opts.managedPage) form.append("managed_page", opts.managedPage);

  opts.onStage?.("uploading");
  const uploadRes = await fetch(`${process.env.BACKEND_URL || "http://127.0.0.1:8000"}${UPLOAD_URL}`, {
    method: "POST",
    headers: {
      "X-Workspace": workspaceDomain,
    },
    body: form,
    signal: opts.signal,
  });

  if (!uploadRes.ok) {
    const body = (await uploadRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || `Upload failed (${uploadRes.status})`);
  }

  const { task_id: taskId } = (await uploadRes.json()) as { task_id: string };
  opts.onStage?.("processing");

  return new Promise<DirectVideoUploadResult>((resolve, reject) => {
    const timer = setInterval(async () => {
      try {
        const statusRes = await fetch(
          `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}${statusUrl(taskId)}`,
          {
            method: "GET",
            headers: {
              "X-Workspace": workspaceDomain,
            },
            signal: opts.signal,
          },
        );
        const data = (await statusRes.json()) as {
          status: string;
          video_id?: string;
          error?: string;
        };

        if (data.status === "published") {
          clearInterval(timer);
          opts.onStage?.("published");
          resolve({ status: "published", videoId: data.video_id });
        } else if (data.status === "rejected") {
          clearInterval(timer);
          opts.onStage?.("rejected");
          resolve({ status: "rejected", error: data.error });
        } else if (data.status === "failed") {
          clearInterval(timer);
          opts.onStage?.("failed");
          resolve({ status: "failed", error: data.error });
        }
      } catch (err) {
        clearInterval(timer);
        reject(err);
      }
    }, 3000);
  });
}

export function useDirectVideoUpload(workspaceDomain: string) {
  const [stage, setStage] = useState<DirectVideoStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const upload = useCallback(
    async (file: File, opts: Omit<DirectVideoUploadOptions, "onStage"> = {}) => {
      setBusy(true);
      setError(null);
      setVideoId(null);
      try {
        const result = await uploadVideoDirect(file, {
          ...opts,
          onStage: (s) => setStage(s),
        }, workspaceDomain);
        if (result.status !== "published") {
          setError(result.error || "Upload failed");
        } else {
          setVideoId(result.videoId ?? null);
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setError(message);
        setStage("failed");
        return { status: "failed", error: message };
      } finally {
        setBusy(false);
      }
    },
    [workspaceDomain],
  );

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setVideoId(null);
    setBusy(false);
  }, []);

  return { upload, reset, stage, error, videoId, busy };
}

const STAGE_LABEL: Record<DirectVideoStage, string> = {
  idle: "Ready to upload",
  uploading: "Uploading video…",
  processing: "Publishing to Facebook…",
  published: "Published",
  rejected: "Rejected by Facebook",
  failed: "Upload failed",
};

interface VideoDirectUploaderProps {
  caption?: string;
  title?: string;
  managedPage?: string;
  disabled?: boolean;
  onResult?: (result: { status: "published" | "rejected" | "failed"; videoId?: string; error?: string }) => void;
  className?: string;
  workspaceDomain: string;
}

export default function VideoDirectUploader({
  caption,
  title,
  managedPage,
  disabled,
  onResult,
  className,
  workspaceDomain,
}: VideoDirectUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { upload, reset, stage, error, videoId, busy } = useDirectVideoUpload(workspaceDomain);

  const handleFile = async (file: File) => {
    const result = await upload(file, { caption, title, managedPage }) as DirectVideoUploadResult;
    onResult?.(result);
  };

  const isDone = stage === "published" || stage === "rejected" || stage === "failed";

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white p-3",
        disabled && "opacity-60 pointer-events-none",
        className,
      )}
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <Film className="size-4 text-indigo-500" />
        Direct video upload
        <span className="text-[11px] font-normal text-slate-400">
          (bypasses the media library)
        </span>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="video/*,.mp4,.mov"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      <div className="mt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
          {busy ? STAGE_LABEL[stage] : "Choose video"}
        </Button>

        {isDone && (
          <Button type="button" variant="ghost" size="sm" onClick={reset}>
            Upload another
          </Button>
        )}
      </div>

      {busy && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
          <Loader2 className="size-3.5 animate-spin" />
          {STAGE_LABEL[stage]}
        </p>
      )}

      {stage === "published" && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-3.5" />
          Published{videoId ? ` · ${videoId}` : ""}
        </p>
      )}

      {(stage === "rejected" || stage === "failed") && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-rose-600">
          <XCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error || STAGE_LABEL[stage]}</span>
        </p>
      )}
    </div>
  );
}
