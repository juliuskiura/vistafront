"use client";

import { AlertTriangle, Loader2, RotateCcw, RotateCw } from "@/lib/icons";
import { formatTimecode } from "@/lib/media/video-utils";

interface VideoPlayerStageProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  poster?: string;
  filter: string;
  isPlaying: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  recovering: boolean;
  error: string | null;
  currentTime: number;
  /** Seconds of media already downloaded beyond the playhead. */
  bufferAhead: number;
  originalFileUrl: string | null;
  onLoadedMetadata: () => void;
  onError: () => void;
  onCanPlay: () => void;
  onTimeUpdate: () => void;
  onPlayState: () => void;
  onVolumeChange: () => void;
  onWaiting: () => void;
  onPlaying: () => void;
  onActivate: (event: React.MouseEvent<HTMLDivElement>) => void;
  onOpenSeek: () => void;
  onRetry: () => void;
}

export function VideoPlayerStage({
  videoRef,
  poster,
  filter,
  isPlaying,
  isLoading,
  isBuffering,
  recovering,
  error,
  currentTime,
  bufferAhead,
  originalFileUrl,
  onLoadedMetadata,
  onError,
  onCanPlay,
  onTimeUpdate,
  onPlayState,
  onVolumeChange,
  onWaiting,
  onPlaying,
  onActivate,
  onOpenSeek,
  onRetry,
}: VideoPlayerStageProps) {
  const showSpinner = recovering || isLoading || (isBuffering && isPlaying);
  const spinnerLabel = recovering
    ? "Reconnecting…"
    : isLoading
      ? "Loading…"
      : "Buffering…";

  return (
    <div
      className="relative flex h-full w-full items-center justify-center cursor-pointer bg-black min-h-[360px]"
      onClick={onActivate}
    >
      <video
        ref={videoRef}
        playsInline
        preload="metadata"
        poster={poster}
        onLoadedMetadata={onLoadedMetadata}
        onCanPlay={onCanPlay}
        onTimeUpdate={onTimeUpdate}
        onPlay={onPlayState}
        onPause={onPlayState}
        onVolumeChange={onVolumeChange}
        onWaiting={onWaiting}
        onPlaying={onPlaying}
        onError={onError}
        className="max-h-[75vh] w-full object-contain"
        style={{ filter }}
      />

      <div
        className="absolute top-5 left-5 z-20 flex flex-col gap-2 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded flex items-center gap-2.5 shadow-md">
          <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
          <span className="text-[10px] font-bold text-white font-mono uppercase tracking-wider">
            {formatTimecode(currentTime, null)}
          </span>
          <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono border-l border-white/20 pl-2">
            TC
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenSeek();
          }}
          className="bg-primary/80 hover:bg-primary backdrop-blur-md text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest flex items-center gap-2 border border-primary/30 transition-colors shadow-md w-fit"
        >
          <span>Seek</span>
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
        </button>
      </div>

      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none">
          <div className="flex flex-col items-center gap-2.5 rounded border border-border bg-black/95 px-5 py-3 shadow-2xl">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">
              {spinnerLabel}
            </span>
            {isBuffering && !recovering && bufferAhead > 0 && (
              <span className="font-mono text-[10px] text-white/50">
                {bufferAhead.toFixed(1)}s buffered
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/95 p-6 text-center z-30">
          <div className="max-w-md space-y-3">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
            <h4 className="font-semibold text-foreground text-sm">Playback Error</h4>
            <p className="text-xs text-muted-foreground font-mono">{error}</p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                className="rounded border border-border bg-muted px-3 py-1.5 text-xs font-mono text-foreground hover:bg-muted/80"
              >
                Try again
              </button>
              {originalFileUrl && (
                <a
                  href={originalFileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-mono text-primary hover:bg-primary/20"
                >
                  Open original file
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {!isPlaying && !isLoading && !error && !recovering && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-white/15 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-transform hover:scale-105">
            <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[22px] border-l-white border-b-[14px] border-b-transparent ml-2"></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DoubleClickRipple({ side }: { side: "left" | "right" | null }) {
  if (!side) return null;
  const isLeft = side === "left";
  const Icon = isLeft ? RotateCcw : RotateCw;
  return (
    <div
      className={`absolute ${isLeft ? "left-10" : "right-10"} flex flex-col items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-md text-white animate-ping pointer-events-none`}
    >
      <Icon className="h-6 w-6" />
      <span className="text-[11px] font-mono font-bold">{isLeft ? "-10s" : "+10s"}</span>
    </div>
  );
}
