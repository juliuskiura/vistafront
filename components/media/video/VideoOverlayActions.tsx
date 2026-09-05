"use client";

import React, { useState } from "react";
import {
  Camera,
  BookmarkPlus,
  Repeat,
  Sparkles,
  Info,
  X,
  Check,
} from "lucide-react";
import { formatTime, formatTimecode } from "@/lib/media/video-utils";
import type { VideoCuePoint } from "@/lib/apptypes/media_libary";

interface VideoOverlayActionsProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  currentTime: number;
  fps: number | null;
  onAddCuePoint: (cue: VideoCuePoint) => void;
  loopRange: { start: number; end: number } | null;
  onSetLoopRange: (range: { start: number; end: number } | null) => void;
  videoFilter: string;
  onSetVideoFilter: (filter: string) => void;
  showStatsOverlay: boolean;
  onToggleStatsOverlay: () => void;
  onFlashNotification: (msg: string) => void;
}

export const VideoOverlayActions: React.FC<VideoOverlayActionsProps> = ({
  videoRef,
  currentTime,
  fps = null,
  onAddCuePoint,
  loopRange,
  onSetLoopRange,
  videoFilter,
  onSetVideoFilter,
  showStatsOverlay,
  onToggleStatsOverlay,
  onFlashNotification,
}) => {
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteDesc, setNoteDesc] = useState("");
  const [noteType, setNoteType] = useState<'marker' | 'note' | 'chapter'>('marker');
  const [isSettingLoop, setIsSettingLoop] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleCaptureFrame = () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setCapturedImage(dataUrl);
        onFlashNotification(`Frame snapshot: ${formatTime(currentTime)} (${canvas.width}×${canvas.height})`);
      }
    } catch (e) {
      const isTaint = e instanceof DOMException && (e.name === 'SecurityError' || e.name === 'InvalidStateError');
      onFlashNotification(isTaint ? 'Frame capture is unavailable for this asset (cross-origin video)' : 'Frame capture failed');
    }
  };

  const handleSaveMarker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;
    const newCue: VideoCuePoint = {
      id: `marker-${Date.now()}`,
      time: currentTime,
      title: noteTitle.trim(),
      description: noteDesc.trim() || undefined,
      type: noteType,
      color: noteType === 'chapter' ? 'var(--primary-500)' : noteType === 'note' ? 'var(--warning)' : 'var(--success-500)',
    };
    onAddCuePoint(newCue);
    setIsAddingNote(false);
    setNoteTitle("");
    setNoteDesc("");
    onFlashNotification(`Marker added at ${formatTime(currentTime)}`);
  };

  const handleSetLoopPoint = () => {
    if (loopStart === null) {
      setLoopStart(currentTime);
      onFlashNotification(`Loop Point A: ${formatTime(currentTime)}`);
    } else {
      const start = Math.min(loopStart, currentTime);
      const end = Math.max(loopStart, currentTime);
      if (end - start < 0.5) {
        onFlashNotification('Loop duration must be at least 0.5 seconds');
        return;
      }
      onSetLoopRange({ start, end });
      setLoopStart(null);
      setIsSettingLoop(false);
      onFlashNotification(`A-B Loop: ${formatTime(start)} → ${formatTime(end)}`);
    }
  };

  const handleClearLoop = () => {
    onSetLoopRange(null);
    setLoopStart(null);
    setIsSettingLoop(false);
    onFlashNotification('Loop deactivated');
  };

  const filterOptions = [
    { id: 'none', label: 'Normal (Original)', filter: 'none' },
    { id: 'high-contrast', label: 'High Contrast', filter: 'contrast(135%) brightness(105%)' },
    { id: 'vibrant', label: 'Vibrant Colors', filter: 'saturate(145%) contrast(110%)' },
    { id: 'grayscale', label: 'Monochrome (B&W)', filter: 'grayscale(100%)' },
    { id: 'night', label: 'Night Assist / Warm', filter: 'sepia(30%) brightness(90%)' },
    { id: 'invert', label: 'Invert (Defect Scan)', filter: 'invert(100%)' },
  ];

  return (
    <>
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        <button onClick={handleCaptureFrame} className="w-8 h-8 bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center rounded hover:bg-black/60 text-white/70 hover:text-white transition-colors" title="Capture frame snapshot" aria-label="Capture snapshot">
          <Camera className="w-4 h-4" />
        </button>
        <button onClick={() => setIsAddingNote(true)} className="w-8 h-8 bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center rounded hover:bg-black/60 text-white/70 hover:text-white transition-colors" title="Add marker at current timestamp" aria-label="Add marker">
          <BookmarkPlus className="w-4 h-4" />
        </button>
        <button onClick={() => { if (loopRange) { handleClearLoop(); } else { setIsSettingLoop(!isSettingLoop); } }} className={`w-8 h-8 backdrop-blur-md border flex items-center justify-center rounded transition-colors ${loopRange ? 'border-warning bg-warning/20 text-warning' : isSettingLoop ? 'border-warning bg-black/60 text-warning animate-pulse' : 'border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`} title="A-B Repeat loop section">
          <Repeat className="w-4 h-4" />
        </button>
        <div className="relative">
          <button onClick={() => setShowFilterMenu(!showFilterMenu)} className={`w-8 h-8 backdrop-blur-md border flex items-center justify-center rounded transition-colors ${videoFilter !== 'none' ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`} title="Visual inspection filters">
            <Sparkles className="w-4 h-4" />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded border border-border bg-popover p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono">Visual Filters</div>
              <div className="space-y-0.5 mt-1">
                {filterOptions.map((opt) => (
                  <button key={opt.id} onClick={() => { onSetVideoFilter(opt.filter); setShowFilterMenu(false); }} className={`flex w-full items-center justify-between rounded px-2 py-1 text-xs text-left transition-colors font-mono ${videoFilter === opt.filter ? 'bg-primary/20 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <span>{opt.label}</span>
                    {videoFilter === opt.filter && <Check className="h-3 w-3 text-primary" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <button onClick={onToggleStatsOverlay} className={`w-8 h-8 backdrop-blur-md border flex items-center justify-center rounded transition-colors ${showStatsOverlay ? 'border-primary bg-primary/20 text-primary' : 'border-white/10 bg-black/40 text-white/70 hover:text-white hover:bg-black/60'}`} title="Toggle diagnostics">
          <Info className="w-4 h-4" />
        </button>
      </div>

      {isSettingLoop && (
        <div className="absolute top-16 right-5 z-20 flex items-center gap-2 rounded border border-warning/40 bg-popover/95 px-3 py-1.5 text-xs text-foreground shadow-xl backdrop-blur-md font-mono animate-in slide-in-from-top-2">
          <Repeat className="h-3.5 w-3.5 text-warning animate-spin" />
          <span className="text-[11px]">{loopStart === null ? '1. Seek to start time & click' : `Start: ${formatTime(loopStart)} → Seek to end`}</span>
          <button onClick={handleSetLoopPoint} className="ml-2 rounded bg-warning px-2 py-0.5 text-[10px] font-bold text-black hover:bg-warning/90 uppercase font-mono">{loopStart === null ? 'Set Point A' : 'Set Point B & Loop'}</button>
          <button onClick={handleClearLoop} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {isAddingNote && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <form onSubmit={handleSaveMarker} className="w-full max-w-md rounded border border-border bg-popover p-5 text-foreground shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2"><BookmarkPlus className="h-4 w-4 text-primary" /><h3 className="font-semibold text-xs uppercase font-mono tracking-wider">Add Marker at Timestamp</h3></div>
              <button type="button" onClick={() => setIsAddingNote(false)} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-3.5 space-y-3">
              <div className="flex items-center justify-between rounded bg-muted px-3 py-1.5 text-xs font-mono border border-border">
                <span className="text-muted-foreground">Current Time</span>
                <span className="font-semibold text-primary">{formatTime(currentTime)} ({formatTimecode(currentTime, fps)})</span>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono mb-1">Cue Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {([{ id: 'marker', label: 'Timeline Marker' }, { id: 'note', label: 'Inspector Note' }, { id: 'chapter', label: 'Chapter' }] as const).map((t) => (
                    <button key={t.id} type="button" onClick={() => setNoteType(t.id)} className={`rounded border px-2 py-1 text-xs font-mono transition-all ${noteType === t.id ? 'border-primary bg-primary/20 text-primary font-semibold' : 'border-border bg-muted text-muted-foreground hover:text-foreground'}`}>{t.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono mb-1">Title / Identifier</label>
                <input type="text" required placeholder="e.g. Dialogue Scene, VFX Transition" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground font-mono focus:border-primary focus:outline-none" autoFocus />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono mb-1">Description</label>
                <textarea rows={2} placeholder="Describe observations or key scene elements..." value={noteDesc} onChange={(e) => setNoteDesc(e.target.value)} className="w-full rounded border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2 pt-2.5 border-t border-border">
              <button type="button" onClick={() => setIsAddingNote(false)} className="rounded border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              <button type="submit" className="rounded bg-primary hover:bg-primary/90 px-3.5 py-1 text-xs font-medium text-primary-foreground shadow-sm">Save Marker</button>
            </div>
          </form>
        </div>
      )}

      {capturedImage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded border border-border bg-popover p-4 text-foreground shadow-2xl">
            <div className="flex items-center justify-between pb-2.5 border-b border-border">
              <div className="flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /><h3 className="font-semibold text-xs font-mono uppercase tracking-wider">Snapshot Frame ({formatTime(currentTime)})</h3></div>
              <button onClick={() => setCapturedImage(null)} className="rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Close"><X className="h-3.5 w-3.5" /></button>
            </div>
            <div className="mt-3 overflow-hidden rounded border border-border bg-black"><img src={capturedImage} alt="Captured video frame" className="w-full object-contain max-h-[45vh]" /></div>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">{formatTimecode(currentTime, fps)}</span>
              <div className="flex gap-2">
                <a href={capturedImage} download={`frame-${Math.round(currentTime * 1000)}.png`} className="rounded bg-primary hover:bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground shadow-sm">Download PNG</a>
                <button onClick={() => setCapturedImage(null)} className="rounded border border-border bg-muted px-3 py-1 text-xs text-muted-foreground hover:text-foreground">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
