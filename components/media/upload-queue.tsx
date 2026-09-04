"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  PauseCircle,
  Trash2,
} from "lucide-react";
import type { UploadItem, UploadItemStatus, UploadSegment } from "@/lib/media/upload-utils";
import { formatBytes, getFileTypeCategory, getFileIcon } from "@/lib/media/upload-utils";

export interface UploadQueueProps {
  uploads: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClear: (id: string) => void;
}

const STATUS_ICON: Record<UploadItemStatus, ReactNode> = {
  pending: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  uploading: <Loader2 className="h-4 w-4 animate-spin text-primary" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
  cancelled: <PauseCircle className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_LABEL: Record<UploadItemStatus, string> = {
  pending: "Pending",
  uploading: "Uploading",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_BADGE: Record<
  UploadItemStatus,
  "default" | "secondary" | "outline" | "destructive" | "soft"
> = {
  pending: "soft",
  uploading: "soft",
  completed: "soft",
  failed: "destructive",
  cancelled: "outline",
};

const STATUS_BADGE_CLASS: Record<UploadItemStatus, string> = {
  pending:
    "bg-primary-100/70 text-primary-700 ring-1 ring-inset ring-primary-200/60 dark:bg-primary-500/20 dark:text-primary-200 dark:ring-primary-500/30",
  uploading:
    "bg-primary-100/70 text-primary-700 ring-1 ring-inset ring-primary-200/60 dark:bg-primary-500/20 dark:text-primary-200 dark:ring-primary-500/30",
  completed:
    "bg-success-500/15 text-success-700 ring-1 ring-inset ring-success-500/25 dark:bg-success-500/20 dark:text-success-300 dark:ring-success-500/30",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const SEGMENT_COLOR: Record<UploadSegment["status"], string> = {
  pending: "bg-muted-foreground/40",
  uploading: "bg-primary-500",
  retrying: "bg-warning",
  done: "bg-success-500",
  failed: "bg-destructive-500",
};

function formatSpeed(bps: number): string {
  if (!bps || bps <= 0) return "—";
  return `${formatBytes(bps)}/s`;
}

function formatEta(seconds: number | null): string {
  if (!seconds || !Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function remainingBytes(segments: UploadSegment[]): number {
  const loaded = segments.reduce((sum, seg) => {
    if (seg.status === "done") return sum + seg.size;
    return sum + Math.min(seg.loaded, seg.size);
  }, 0);
  return Math.max(0, segments.reduce((sum, seg) => sum + seg.size, 0) - loaded);
}

function SegmentBar({ segments }: { segments: UploadSegment[] }) {
  const total = segments.reduce((s, seg) => s + seg.size, 0);
  const done = segments
    .filter((s) => s.status === "done")
    .reduce((s, seg) => s + seg.size, 0);

  return (
    <div className="flex w-full grow flex-col gap-2">
      <div
        className="flex h-3 w-full overflow-hidden rounded-full bg-muted ring-1 ring-inset ring-border/60"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
      >
        {total > 0 &&
          segments.map((seg) => (
            <div
              key={seg.part_number}
              className={`relative h-full ${SEGMENT_COLOR[seg.status]}${
                seg.status === "uploading" ? " upload-segment-shimmer" : ""
              }`}
              style={{
                width: `${Math.max((seg.size / total) * 100, segments.length > 200 ? 0.2 : 0.5)}%`,
              }}
              title={`Segment ${seg.part_number} · ${formatBytes(seg.size)} · ${seg.status}${seg.attempts > 1 ? ` (${seg.attempts} attempts)` : ""}`}
            />
          ))}
      </div>
    </div>
  );
}

export function UploadQueue({
  uploads,
  onCancel,
  onRetry,
  onClear,
}: UploadQueueProps) {
  if (!uploads.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50/60 ring-1 ring-inset ring-primary-200/50 dark:bg-primary-500/10 dark:ring-primary-500/20">
          <Clock className="h-6 w-6 text-primary-500" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">No uploads yet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Files you add will appear here with live progress.
        </p>
      </div>
    );
  }

  const active = uploads.filter(
    (u) => u.status === "uploading" || u.status === "pending",
  );
  const completed = uploads.filter((u) => u.status === "completed");
  const failed = uploads.filter(
    (u) => u.status === "failed" || u.status === "cancelled",
  );
  const visible = [...uploads].sort(
    (a, b) =>
      (a.status === "completed" ? 1 : 0) -
      (b.status === "completed" ? 1 : 0),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full bg-primary-50/60 px-2.5 py-1 font-medium text-primary-600 ring-1 ring-inset ring-primary-200/50 dark:bg-primary-500/10 dark:text-primary-300 dark:ring-primary-500/20">
          {active.length} active
        </span>
        {completed.length > 0 && (
          <span className="rounded-full bg-success-500/10 px-2.5 py-1 font-medium text-success-700 ring-1 ring-inset ring-success-500/20 dark:text-success-400">
            {completed.length} done
          </span>
        )}
        {failed.length > 0 && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 font-medium text-destructive ring-1 ring-inset ring-destructive/20">
            {failed.length} failed
          </span>
        )}
      </div>
      <div className="space-y-2">
        {visible.map((item) => (
          <UploadItemRow
            key={item.id}
            item={item}
            onCancel={onCancel}
            onRetry={onRetry}
            onClear={onClear}
          />
        ))}
      </div>
    </div>
  );
}

function UploadItemRow({
  item,
  onCancel,
  onRetry,
  onClear,
}: {
  item: UploadItem;
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onClear: (id: string) => void;
}) {
  const category = useMemo(() => getFileTypeCategory(item.file), [item.file]);
  const Icon = useMemo(() => getFileIcon(category), [category]);
  const canCancel =
    item.status === "uploading" || item.status === "pending";
  const canRetry = item.status === "failed" || item.status === "cancelled";
  const canClear = item.status === "failed" || item.status === "cancelled";

  const segments = item.segments;
  const showSegments = !!segments && segments.length > 0;
  const remainingBps = item.speedBps ?? 0;

  return (
    <div className="group flex items-center gap-3 rounded-2xl border bg-card p-3 text-sm shadow-sm shadow-background/40 transition-colors hover:bg-card/80">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${
          item.status === "completed"
            ? "bg-success-500/10 ring-success-500/20 text-success-600 dark:text-success-400"
            : item.status === "failed"
              ? "bg-destructive/10 ring-destructive/20 text-destructive"
              : "bg-primary-100/70 ring-primary-200/60 text-primary-600 dark:bg-primary-500/15 dark:ring-primary-500/30 dark:text-primary-300"
        }`}
      >
        {item.status === "pending" || item.status === "uploading" ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : (
          <Icon className="h-5 w-5" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className="block max-w-[220px] truncate font-medium"
            title={item.filename}
          >
            {item.filename}
          </span>
          <Badge
            variant={STATUS_BADGE[item.status]}
            className={`capitalize ${STATUS_BADGE_CLASS[item.status]}`}
          >
            {STATUS_ICON[item.status]}
            <span className="ml-1">{STATUS_LABEL[item.status]}</span>
          </Badge>
        </div>

        {showSegments ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <SegmentBar segments={segments} />
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              {item.status === "uploading" ? (
                <>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="uppercase tracking-widest">Progress</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {item.progress}%
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                    <span className="uppercase tracking-widest">Speed</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatSpeed(remainingBps)}
                    </span>
                  </span>
                  {remainingBps > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="uppercase tracking-widest">ETA</span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {formatEta(remainingBytes(segments) / remainingBps)}
                      </span>
                    </span>
                  )}
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span className="uppercase tracking-widest">Progress</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {item.progress}%
                  </span>
                </span>
              )}
            </div>
          </>
        ) : item.status === "pending" ? (
          <>
            <div className="mt-2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span className="text-xs font-medium text-primary-600 dark:text-primary-300">
                Starting upload…
              </span>
              <span className="text-xs text-muted-foreground">
                {formatBytes(item.size)}
              </span>
            </div>
            <div className="mt-2">
              <Progress value={0} className="bg-muted" />
            </div>
          </>
        ) : (
          <>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatBytes(item.size)} · {item.progress}% complete
              </span>
            </div>
            <div className="mt-2">
              <Progress
                value={item.progress ?? 0}
                className={cnStatus(item.status)}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {canRetry && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRetry(item.id)}
            title="Retry upload"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        )}
        {canCancel && (
          <Button
            variant="outline"
            size="icon"
            className="text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onCancel(item.id)}
            title={item.status === "pending" ? "Cancel" : "Stop upload"}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
        {canClear && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onClear(item.id)}
            title="Dismiss error"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
}

function cnStatus(status: UploadItemStatus): string {
  if (status === "failed") return "bg-destructive/20";
  if (status === "completed") return "bg-success-500/20";
  return "";
}
