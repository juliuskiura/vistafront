"use client";

import React, { useRef, useState, useCallback } from "react";
import { formatTime } from "@/lib/media/video-utils";
import type { VideoCuePoint } from "@/lib/apptypes/media_libary";

interface VideoProgressBarProps {
  currentTime: number;
  duration: number;
  buffered: TimeRanges | null;
  cuePoints?: VideoCuePoint[];
  loopRange?: { start: number; end: number } | null;
  onSeek: (targetTime: number) => void;
  onScrubStart?: () => void;
  onScrubEnd?: () => void;
  disabled?: boolean;
  fps?: number | null;
}

export const VideoProgressBar: React.FC<VideoProgressBarProps> = ({
  currentTime,
  duration,
  buffered,
  cuePoints = [],
  loopRange,
  onSeek,
  onScrubStart,
  onScrubEnd,
  disabled = false,
  fps = null,
}) => {
  const barRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [activeCuePoint, setActiveCuePoint] = useState<VideoCuePoint | null>(null);

  const isDisabled = disabled || duration <= 0;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const getTimeFromPointer = useCallback(
    (clientX: number): number => {
      if (!barRef.current || duration <= 0) return 0;
      const rect = barRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return ratio * duration;
    },
    [duration],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDisabled) return;
    e.preventDefault();
    setIsDragging(true);
    onScrubStart?.();
    const targetTime = getTimeFromPointer(e.clientX);
    onSeek(targetTime);
    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!barRef.current || duration <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const time = ratio * duration;
    const clampedPos = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverPosition(clampedPos);
    setHoverTime(time);
    const matchingCue = cuePoints.find((cp) => Math.abs(cp.time - time) < Math.max(2, duration * 0.015));
    setActiveCuePoint(matchingCue || null);
    if (isDragging) {
      onSeek(time);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      onScrubEnd?.();
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
      setHoverTime(null);
      setActiveCuePoint(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;
    let step = 5;
    if (e.shiftKey) step = 1;
    if (e.altKey && fps) step = 1 / fps;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowUp': e.preventDefault(); onSeek(Math.min(duration, currentTime + step)); break;
      case 'ArrowLeft': case 'ArrowDown': e.preventDefault(); onSeek(Math.max(0, currentTime - step)); break;
      case 'PageUp': e.preventDefault(); onSeek(Math.min(duration, currentTime + 30)); break;
      case 'PageDown': e.preventDefault(); onSeek(Math.max(0, currentTime - 30)); break;
      case 'Home': e.preventDefault(); onSeek(0); break;
      case 'End': e.preventDefault(); onSeek(duration); break;
    }
  };

  const renderBufferedSegments = () => {
    if (!buffered || duration <= 0) return null;
    const segments = [];
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      const startPct = (start / duration) * 100;
      const widthPct = ((end - start) / duration) * 100;
      segments.push(
        <div key={`buf-${i}`} className="absolute top-0 bottom-0 bg-white/20 rounded-full transition-all duration-150" style={{ left: `${startPct}%`, width: `${widthPct}%` }} />,
      );
    }
    return segments;
  };

  const renderLoopRange = () => {
    if (!loopRange || duration <= 0) return null;
    const startPct = (loopRange.start / duration) * 100;
    const widthPct = ((loopRange.end - loopRange.start) / duration) * 100;
    return (
      <div className="absolute top-0 bottom-0 bg-warning/35 border-x border-warning pointer-events-none rounded-xs" style={{ left: `${startPct}%`, width: `${widthPct}%` }} title={`Loop: ${formatTime(loopRange.start)} - ${formatTime(loopRange.end)}`} />
    );
  };

  return (
    <div className="relative w-full select-none py-2 group/progress cursor-pointer" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerLeave} tabIndex={isDisabled ? -1 : 0} role="slider" aria-label="Seek video timeline" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(currentTime)} aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`} onKeyDown={handleKeyDown}>
      <div ref={barRef} className="relative h-1.5 w-full bg-white/20 rounded-full overflow-visible transition-all group-hover/progress:h-2">
        {renderBufferedSegments()}
        {renderLoopRange()}
        <div className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-75" style={{ width: `${progressPercent}%` }}>
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-primary rounded-full transition-all shadow-md ${isDragging ? 'scale-125' : 'scale-0 group-hover/progress:scale-100'}`} />
        </div>
        {cuePoints.map((cp) => {
          const cpPct = duration > 0 ? (cp.time / duration) * 100 : 0;
          return (
            <div key={cp.id} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-2 w-1 bg-white/70 hover:bg-white rounded-xs z-10" style={{ left: `${cpPct}%` }} title={`${cp.title} (${formatTime(cp.time)})`} onClick={(e) => { e.stopPropagation(); onSeek(cp.time); }} />
          );
        })}
        {hoverPosition !== null && (
          <div className="absolute top-0 h-full bg-white/40 w-[2px] h-3.5 -top-1 pointer-events-none" style={{ left: `${hoverPosition}px` }} />
        )}
      </div>
      {hoverPosition !== null && hoverTime !== null && (
        <div className="pointer-events-none absolute bottom-5 -translate-x-1/2 z-30 flex flex-col items-center animate-in fade-in zoom-in-95 duration-100" style={{ left: `${hoverPosition}px` }}>
          <div className="flex flex-col items-center gap-0.5 rounded border border-border bg-popover px-2 py-1 text-[11px] text-foreground shadow-xl backdrop-blur-md font-mono">
            {activeCuePoint && <span className="max-w-[160px] truncate text-[10px] font-semibold text-primary">{activeCuePoint.title}</span>}
            <span className="font-mono text-[11px] font-semibold text-foreground">{formatTime(hoverTime, duration >= 3600)}</span>
          </div>
        </div>
      )}
    </div>
  );
};
