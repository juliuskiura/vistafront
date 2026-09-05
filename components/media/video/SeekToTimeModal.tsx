"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { formatTime, formatTimecode, parseTimeString } from "@/lib/media/video-utils";
import type { VideoCuePoint } from "@/lib/apptypes/media_libary";

interface SeekToTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTime: number;
  duration: number;
  fps?: number | null;
  cuePoints?: VideoCuePoint[];
  onSeek: (targetTime: number) => void;
}

export function SeekToTimeModal({
  isOpen,
  onClose,
  currentTime,
  duration,
  fps = null,
  cuePoints = [],
  onSeek,
}: SeekToTimeModalProps) {
  const [timeInput, setTimeInput] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewTime, setPreviewTime] = useState(currentTime);

  useEffect(() => {
    if (isOpen) {
      setTimeInput(formatTime(currentTime, duration >= 3600));
      setPreviewTime(currentTime);
      setErrorMsg(null);
    }
  }, [isOpen, currentTime, duration]);

  const handleApplySeek = (targetSec: number) => {
    const clamped = Math.max(0, Math.min(duration, targetSec));
    onSeek(clamped);
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseTimeString(timeInput, fps);
    if (parsed === null || isNaN(parsed)) {
      setErrorMsg("Invalid time format. Use MM:SS, HH:MM:SS, or seconds.");
      return;
    }
    if (parsed > duration) {
      setErrorMsg(`Time cannot exceed duration (${formatTime(duration)})`);
      return;
    }
    handleApplySeek(parsed);
  };

  const stepFrames = (frameCount: number) => {
    if (fps == null) return;
    const frameDuration = 1 / fps;
    const newTime = Math.max(0, Math.min(duration, previewTime + frameCount * frameDuration));
    setPreviewTime(newTime);
    setTimeInput(formatTime(newTime, duration >= 3600));
    onSeek(newTime);
  };

  const stepSeconds = (sec: number) => {
    const newTime = Math.max(0, Math.min(duration, previewTime + sec));
    setPreviewTime(newTime);
    setTimeInput(formatTime(newTime, duration >= 3600));
    onSeek(newTime);
  };

  const handleInlineSeekSubmit = () => {
    const parsed = parseTimeString(timeInput, fps);
    if (parsed != null && !isNaN(parsed) && parsed <= duration) {
      onSeek(parsed);
      onClose();
    } else {
      setErrorMsg("Invalid time format.");
    }
  };

  const percentagePresets = [
    { label: "0%", pct: 0 },
    { label: "25%", pct: 0.25 },
    { label: "50%", pct: 0.5 },
    { label: "75%", pct: 0.75 },
    { label: "90%", pct: 0.9 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Seek to Timecode{fps != null ? ` / Frame (${fps} FPS)` : ""}
          </DialogTitle>
          <DialogDescription>
            Jump to a timestamp. {fps == null ? "Frame stepping is unavailable (frame rate unknown)." : "Frame stepping is enabled."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between rounded bg-muted p-3 border border-border">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Current Stamp</div>
            <div className="font-mono text-xl font-bold text-primary">
              {formatTime(previewTime, true)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Timecode</div>
            <div className="font-mono text-xs text-foreground font-medium">
              {formatTimecode(previewTime, fps)}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Target Timecode (e.g. <span className="text-primary">00:04:12</span>)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={timeInput}
              onChange={(e) => {
                setTimeInput(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="00:04:12"
              className="flex-1 rounded border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              autoFocus
            />
            <VSButton type="submit" size="sm" variant="secondary">
              Jump
            </VSButton>
          </div>
          {errorMsg && <p className="text-xs text-destructive font-mono">{errorMsg}</p>}
        </form>

        <div className="space-y-1.5">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">
            Frame Stepping {fps == null && "(unavailable)"}
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: "-5 F", n: -5 },
              { label: "-1 F", n: -1 },
              { label: "+1 F", n: 1 },
              { label: "+5 F", n: 5 },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                disabled={fps == null}
                onClick={() => stepFrames(b.n)}
                className="flex items-center justify-center rounded border border-border bg-muted py-1.5 text-xs font-mono text-muted-foreground hover:text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-1">
          {[-30, -10, -5, 5, 10, 30].map((sec) => (
            <button
              key={`sec-${sec}`}
              type="button"
              onClick={() => stepSeconds(sec)}
              className="flex-1 rounded border border-border bg-muted py-1 font-mono text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              {sec > 0 ? `+${sec}s` : `${sec}s`}
            </button>
          ))}
        </div>

        <div className="space-y-1 pt-2 border-t border-border">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Inline Seek</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={timeInput}
              onChange={(e) => { setTimeInput(e.target.value); setErrorMsg(null); }}
              placeholder="Use S for precise seek"
              className="flex-1 rounded border border-border bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
            />
            <VSButton type="button" size="sm" variant="secondary" onClick={handleInlineSeekSubmit}>
              Go
            </VSButton>
          </div>
        </div>

        {cuePoints.length > 0 && (
          <div className="space-y-1 pt-2 border-t border-border">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Markers</div>
            <div className="flex flex-wrap gap-1">
              {cuePoints.map((cp) => (
                <button
                  key={cp.id}
                  type="button"
                  onClick={() => handleApplySeek(cp.time)}
                  className="rounded border border-border bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground hover:border-primary hover:text-primary"
                  title={cp.title}
                >
                  {formatTime(cp.time)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1 pt-2 border-t border-border">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Presets</div>
          <div className="flex flex-wrap gap-1">
            {percentagePresets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => handleApplySeek(duration * p.pct)}
                className="rounded border border-border bg-muted px-2.5 py-0.5 text-xs font-mono text-muted-foreground hover:border-primary hover:text-primary"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <DialogClose asChild>
          <VSButton appearance="ghost" className="w-full">Close</VSButton>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
