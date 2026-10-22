"use client";

import {
  HelpCircle,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture,
  Play,
  Settings,
  SlidersHorizontal,
  Tv,
  Volume1,
  Volume2,
  VolumeX,
} from "@/lib/icons";
import { formatTime } from "@/lib/media/video-utils";
import { VideoProgressBar } from "../VideoProgressBar";
import type { VideoCuePoint, VideoPlayerState } from "@/lib/apptypes/media_libary";

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

interface VideoPlayerControlsProps {
  playerState: VideoPlayerState;
  cuePoints: VideoCuePoint[];
  controlsVisible: boolean;
  showSettings: boolean;
  onSeek: (time: number) => void;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onToggleFullscreen: () => void;
  onTogglePictureInPicture: () => void;
  onToggleTheater: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenStats: () => void;
}

export function VideoPlayerControls({
  playerState,
  cuePoints,
  controlsVisible,
  showSettings,
  onSeek,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onToggleFullscreen,
  onTogglePictureInPicture,
  onToggleTheater,
  onSetPlaybackRate,
  onToggleSettings,
  onOpenShortcuts,
  onOpenStats,
}: VideoPlayerControlsProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    buffered,
    volume,
    isMuted,
    playbackRate,
    isFullscreen,
    isPictureInPicture,
    isTheaterMode,
    loopRange,
  } = playerState;

  return (
    <div
      className={`mt-auto w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-5 pb-3 transition-opacity duration-300 ${
        controlsVisible || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <VideoProgressBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        cuePoints={cuePoints}
        loopRange={loopRange}
        onSeek={onSeek}
        fps={null}
      />

      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={onTogglePlay}
              className="text-white hover:text-primary transition-colors focus-visible:outline-none"
              title={isPlaying ? "Pause (Space or K)" : "Play (Space or K)"}
              aria-label={isPlaying ? "Pause video" : "Play video"}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current" />
              )}
            </button>
            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className="text-white/70 hover:text-white transition-colors"
                title="Mute (M)"
                aria-label={isMuted || volume === 0 ? "Unmute video" : "Mute video"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-destructive" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <div className="w-16 sm:w-20 h-1 bg-white/20 rounded-full relative cursor-pointer group/vol">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  aria-label="Volume slider"
                />
                <div
                  className="absolute left-0 top-0 h-full bg-white rounded-full"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
          <div className="font-mono text-xs flex items-center gap-1.5">
            <span className="text-white font-semibold">
              {formatTime(currentTime, duration >= 3600)}
            </span>
            <span className="text-white/30">/</span>
            <span className="text-white/60">
              {formatTime(duration, duration >= 3600)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center bg-muted rounded px-2 py-1 gap-1.5 border border-border">
            <span className="text-[10px] text-muted-foreground font-mono shrink-0">SEEK:</span>
            <span className="text-[10px] font-mono text-primary w-16">{formatTime(currentTime)}</span>
          </div>
          <button
            onClick={() => onToggleSettings()}
            className={`transition-colors ${
              showSettings ? "text-primary" : "text-white/70 hover:text-white"
            }`}
            title="Playback Settings"
            aria-label="Playback settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePictureInPicture}
            className={`transition-colors ${
              isPictureInPicture ? "text-primary" : "text-white/70 hover:text-white"
            }`}
            title="Picture in Picture (P)"
            aria-label="Picture in picture"
          >
            <PictureInPicture className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleTheater}
            className={`transition-colors hidden sm:block ${
              isTheaterMode ? "text-primary" : "text-white/70 hover:text-white"
            }`}
            title="Theater Mode (T)"
            aria-label="Theater mode"
          >
            <Tv className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleFullscreen}
            className="text-white/70 hover:text-white transition-colors"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={onOpenShortcuts}
            className="text-white/70 hover:text-white transition-colors"
            title="Keyboard shortcuts (?)"
            aria-label="Keyboard shortcuts"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="absolute right-5 bottom-20 w-52 rounded border border-border bg-popover p-3 text-foreground shadow-2xl z-50 animate-in fade-in zoom-in-95">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono pb-1.5 border-b border-border">
            Playback Rate
          </div>
          <div className="grid grid-cols-4 gap-1">
            {PLAYBACK_SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => onSetPlaybackRate(speed)}
                className={`rounded py-0.5 text-xs font-mono transition-colors ${
                  playbackRate === speed
                    ? "bg-primary font-bold text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono pt-2 pb-1 border-t border-border">
            Inspection
          </div>
          <button
            onClick={onOpenStats}
            className="mt-1 flex w-full items-center justify-between rounded px-2 py-1 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <span>Diagnostics HUD</span>
            <SlidersHorizontal className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
