"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  RotateCcw,
  RotateCw,
  Settings,
  Tv,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Sliders,
} from "lucide-react";
import { VideoProgressBar } from "./VideoProgressBar";
import { VideoOverlayActions } from "./VideoOverlayActions";
import { SeekToTimeModal } from "./SeekToTimeModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { VideoTechnicalStats } from "./VideoTechnicalStats";
import { attachHls, isHlsAsset, isHlsSupported } from "@/lib/media/hls";
import { formatTime, formatTimecode, toProtocolRelative } from "@/lib/media/video-utils";
import type { Asset } from "@/lib/api";
import type { VideoCuePoint, VideoPlayerState } from "@/lib/apptypes/media_libary";

interface VideoPlayerProps {
  asset: Asset;
  onCuePointAdd?: (cue: VideoCuePoint) => void;
  cuePoints?: VideoCuePoint[];
  onLoadedMetadata?: (info: { duration: number; width: number; height: number }) => void;
  onSourceExpired?: () => void;
  className?: string;
}

export function VideoPlayer({
  asset,
  onCuePointAdd,
  cuePoints = [],
  onLoadedMetadata,
  onSourceExpired,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResumeTime = useRef<number | null>(null);
  const isReconnecting = useRef(false);
  const hlsRef = useRef<ReturnType<typeof attachHls> | null>(null);

  const [playerState, setPlayerState] = useState<VideoPlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: asset.duration_seconds || 0,
    buffered: null,
    bufferedEnd: 0,
    volume: 1,
    isMuted: false,
    playbackRate: 1,
    isFullscreen: false,
    isPictureInPicture: false,
    isTheaterMode: false,
    loopRange: null,
    isLoading: true,
    isBuffering: false,
    error: null,
  });

  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSeekModal, setShowSeekModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [videoFilter, setVideoFilter] = useState("none");
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [doubleClickRipple, setDoubleClickRipple] = useState<'left' | 'right' | null>(null);
  const [sourceKind, setSourceKind] = useState<'progressive' | 'hls' | 'unsupported'>('progressive');
  const [reconnecting, setReconnecting] = useState(false);
  const fps = null;

  const flashNotification = useCallback((msg: string) => {
    setFlashMessage(msg);
    if (flashToastTimer.current) clearTimeout(flashToastTimer.current);
    flashToastTimer.current = setTimeout(() => {
      setFlashMessage(null);
    }, 2200);
  }, []);

  const resolveVideoSource = useCallback((): { src: string | null; kind: 'progressive' | 'hls' | 'unsupported' } => {
    const src = toProtocolRelative(asset.stream_url) || toProtocolRelative(asset.original_file) || null;
    if (!src) return { src: null, kind: 'unsupported' };
    if (isHlsAsset(asset)) {
      if (!isHlsSupported()) return { src, kind: 'unsupported' };
      return { src, kind: 'hls' };
    }
    return { src, kind: 'progressive' };
  }, [asset]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    hlsRef.current?.detach();
    hlsRef.current = null;

    const resolved = resolveVideoSource();
    setSourceKind(resolved.kind);
    setPlayerState((prev) => ({
      ...prev,
      isLoading: resolved.kind !== 'unsupported',
      error: null,
      currentTime: 0,
    }));

    if (resolved.kind === 'unsupported' || !resolved.src) return;

    if (resolved.kind === 'hls') {
      hlsRef.current = attachHls(video, resolved.src, (errMessage) => {
        setPlayerState((prev) => ({
          ...prev,
          isLoading: false,
          error: errMessage || 'Playback error occurred on HLS stream.',
        }));
      });
    } else {
      video.src = resolved.src;
      video.load();
    }

    return () => {
      hlsRef.current?.detach();
      hlsRef.current = null;
      video.removeAttribute('src');
      video.load();
    };
  }, [asset.original_file, asset.stream_url, resolveVideoSource]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    const info = {
      duration: video.duration || 0,
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
    };
    setPlayerState((prev) => ({ ...prev, duration: info.duration, isLoading: false }));
    if (pendingResumeTime.current != null) {
      try { video.currentTime = pendingResumeTime.current; } catch {}
      pendingResumeTime.current = null;
      setReconnecting(false);
      isReconnecting.current = false;
    }
    onLoadedMetadata?.(info);
  };

  const handleError = () => {
    const video = videoRef.current;
    if (!video) return;
    const code = video.error?.code;
    if (code === 3 || code === 4) {
      pendingResumeTime.current = video.currentTime || 0;
      isReconnecting.current = true;
      setReconnecting(true);
      onSourceExpired?.();
    } else {
      setPlayerState((prev) => ({ ...prev, error: 'This video could not be played.' }));
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    if (playerState.loopRange) {
      if (video.currentTime >= playerState.loopRange.end || video.currentTime < playerState.loopRange.start) {
        video.currentTime = playerState.loopRange.start;
      }
    }
    let bufferedEnd = 0;
    if (video.buffered.length > 0) {
      bufferedEnd = video.buffered.end(video.buffered.length - 1);
    }
    setPlayerState((prev) => ({
      ...prev,
      currentTime: video.currentTime,
      duration: video.duration || prev.duration || 0,
      buffered: video.buffered,
      bufferedEnd,
      isBuffering: false,
    }));
  };

  const handlePlayState = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerState((prev) => ({ ...prev, isPlaying: !video.paused }));
  };

  const handleVolumeChange = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerState((prev) => ({
      ...prev,
      volume: video.volume,
      isMuted: video.muted,
    }));
  };

  const handleWaiting = () => {
    setPlayerState((prev) => ({ ...prev, isBuffering: true }));
  };

  const handlePlaying = () => {
    setPlayerState((prev) => ({ ...prev, isBuffering: false, isLoading: false, isPlaying: true }));
  };

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => {
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        flashNotification('Play');
      }).catch(() => {});
    } else {
      video.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      flashNotification('Pause');
    }
  }, [flashNotification]);

  const handleSeek = useCallback((targetTime: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(video.duration || asset.duration_seconds || 0, targetTime));
    video.currentTime = clamped;
    setPlayerState((prev) => ({ ...prev, currentTime: clamped }));
  }, [asset.duration_seconds, flashNotification]);

  const handleSkip = useCallback((seconds: number) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = video.currentTime + seconds;
    handleSeek(newTime);
    flashNotification(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
  }, [handleSeek, flashNotification]);

  const handleVolumeSlide = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    const clamped = Math.max(0, Math.min(1, val));
    video.volume = clamped;
    video.muted = clamped === 0;
    setPlayerState((prev) => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
  };

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setPlayerState((prev) => ({ ...prev, isMuted: video.muted }));
    flashNotification(video.muted ? 'Muted' : `Volume ${Math.round(video.volume * 100)}%`);
  }, [flashNotification]);

  const setPlaybackSpeed = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
    setShowSettingsMenu(false);
    flashNotification(`Speed: ${rate}x`);
  };

  const handleInlineSeekSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    flashNotification('Use S for precise seek');
  };

  const toggleFullscreen = useCallback(async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: true }));
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
        setPlayerState((prev) => ({ ...prev, isFullscreen: false }));
      }
    } catch {}
  }, []);

  const togglePictureInPicture = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPlayerState((prev) => ({ ...prev, isPictureInPicture: false }));
      } else if (video.requestPictureInPicture) {
        await video.requestPictureInPicture();
        setPlayerState((prev) => ({ ...prev, isPictureInPicture: true }));
      }
    } catch {}
  }, []);

  const toggleTheaterMode = useCallback(() => {
    setPlayerState((prev) => {
      const next = !prev.isTheaterMode;
      flashNotification(next ? 'Theater Mode' : 'Standard View');
      return { ...prev, isTheaterMode: next };
    });
  }, [flashNotification]);

  const resetControlsTimer = useCallback(() => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    if (playerState.isPlaying) {
      hideControlsTimer.current = setTimeout(() => {
        setControlsVisible(false);
        setShowSettingsMenu(false);
      }, 3500);
    }
  }, [playerState.isPlaying]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState((prev) => ({ ...prev, isFullscreen: !!document.fullscreenElement }));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => { document.removeEventListener('fullscreenchange', handleFullscreenChange); };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const activeTag = (document.activeElement?.tagName || '').toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
    if (document.querySelector('[data-slot="dialog-content"]')) return;
    const video = videoRef.current;
    if (!video) return;

    switch (e.key) {
      case ' ': case 'k': case 'K':
        e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft':
        e.preventDefault();
        if (e.shiftKey) handleSkip(-1); else handleSkip(-5);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (e.shiftKey) handleSkip(1); else handleSkip(5);
        break;
      case 'j': case 'J':
        e.preventDefault(); handleSkip(-10); break;
      case 'l': case 'L':
        e.preventDefault(); handleSkip(10); break;
      case ',': case '<':
        if (asset.duration_seconds && video.paused) {
          e.preventDefault();
          handleSeek(video.currentTime - 1 / Math.max(asset.duration_seconds, 0.001));
          flashNotification('Step -1 Frame');
        }
        break;
      case '.': case '>':
        if (asset.duration_seconds && video.paused) {
          e.preventDefault();
          handleSeek(video.currentTime + 1 / Math.max(asset.duration_seconds, 0.001));
          flashNotification('Step +1 Frame');
        }
        break;
      case 'ArrowUp':
        e.preventDefault(); handleVolumeSlide(Math.min(1, video.volume + 0.05));
        flashNotification(`Volume ${Math.round(Math.min(1, video.volume + 0.05) * 100)}%`);
        break;
      case 'ArrowDown':
        e.preventDefault(); handleVolumeSlide(Math.max(0, video.volume - 0.05));
        flashNotification(`Volume ${Math.round(Math.max(0, video.volume - 0.05) * 100)}%`);
        break;
      case 'm': case 'M':
        e.preventDefault(); toggleMute(); break;
      case 'f': case 'F':
        e.preventDefault(); toggleFullscreen(); break;
      case 't': case 'T':
        e.preventDefault(); toggleTheaterMode(); break;
      case 'p': case 'P':
        e.preventDefault(); togglePictureInPicture(); break;
      case 's': case 'S':
        e.preventDefault(); setShowSeekModal(true); break;
      case '?':
        e.preventDefault(); setShowShortcutsModal(true); break;
      case '0': case '1': case '2': case '3': case '4': case '5': case '6': case '7': case '8': case '9':
        e.preventDefault();
        const pct = parseInt(e.key, 10) / 10;
        handleSeek((video.duration || asset.duration_seconds || 0) * pct);
        flashNotification(`Jump to ${pct * 100}%`);
        break;
    }
  };

  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    containerRef.current?.focus();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const w = rect.width;
    if (e.detail === 2) {
      if (clickX < w * 0.35) { handleSkip(-10); setDoubleClickRipple('left'); setTimeout(() => setDoubleClickRipple(null), 500); }
      else if (clickX > w * 0.65) { handleSkip(10); setDoubleClickRipple('right'); setTimeout(() => setDoubleClickRipple(null), 500); }
      else { toggleFullscreen(); }
    } else if (e.detail === 1) {
      togglePlay();
    }
  };

  const playbackSpeeds = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

  if (sourceKind === 'unsupported') {
    const isHls = isHlsAsset(asset);
    return (
      <div ref={containerRef} className="relative flex items-center justify-center rounded border border-border bg-black min-h-[360px]" tabIndex={0} role="region" aria-label={`Video player for ${asset.name}`} onKeyDown={handleKeyDown}>
        <div className="max-w-md px-6 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <h4 className="mt-3 font-semibold text-foreground text-sm">{isHls ? 'Adaptive streaming not available' : 'Video source unavailable'}</h4>
          <p className="mt-1 text-xs text-muted-foreground">{isHls ? 'Your browser does not support HLS adaptive streaming (.m3u8). Download the original file to view it.' : 'No video source or supported media stream was found for this asset. Download the original file to view it.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative group select-none overflow-hidden rounded border border-border bg-black transition-all duration-300 ${playerState.isTheaterMode ? 'w-full max-h-[85vh]' : 'w-full max-h-[75vh]'}`} onMouseMove={resetControlsTimer} onMouseLeave={() => { if (playerState.isPlaying) { setControlsVisible(false); setShowSettingsMenu(false); } }} tabIndex={0} role="region" aria-label={`Video player for ${asset.name}`} onKeyDown={handleKeyDown}>
      <div className="relative flex h-full w-full items-center justify-center cursor-pointer bg-black min-h-[360px]" onClick={handleVideoAreaClick}>
        <video ref={videoRef} playsInline poster={asset.thumbnail || undefined} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} onPlay={handlePlayState} onPause={handlePlayState} onVolumeChange={handleVolumeChange} onWaiting={handleWaiting} onPlaying={handlePlaying} onError={handleError} className="max-h-[75vh] w-full object-contain" style={{ filter: videoFilter }} />

        <div className="absolute top-5 left-5 z-20 flex flex-col gap-2 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded flex items-center gap-2.5 shadow-md">
            <div className="w-2 h-2 rounded-full bg-destructive animate-pulse"></div>
            <span className="text-[10px] font-bold text-white font-mono uppercase tracking-wider">{formatTimecode(playerState.currentTime, null)}</span>
            <span className="text-[10px] text-white/50 uppercase tracking-widest font-mono border-l border-white/20 pl-2">TC</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); setShowSeekModal(true); }} className="bg-primary/80 hover:bg-primary backdrop-blur-md text-primary-foreground text-[10px] font-bold px-3 py-1.5 rounded uppercase tracking-widest flex items-center gap-2 border border-primary/30 transition-colors shadow-md w-fit">
            <span>Seek</span><div className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></div>
          </button>
        </div>

        {doubleClickRipple === 'left' && (
          <div className="absolute left-10 flex flex-col items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-md text-white animate-ping pointer-events-none"><RotateCcw className="h-6 w-6" /><span className="text-[11px] font-mono font-bold">-10s</span></div>
        )}
        {doubleClickRipple === 'right' && (
          <div className="absolute right-10 flex flex-col items-center justify-center h-20 w-20 rounded-full bg-white/20 backdrop-blur-md text-white animate-ping pointer-events-none"><RotateCw className="h-6 w-6" /><span className="text-[11px] font-mono font-bold">+10s</span></div>
        )}

        {(playerState.isLoading || playerState.isBuffering || reconnecting) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs pointer-events-none">
            <div className="flex flex-col items-center gap-2.5 rounded border border-border bg-black/95 px-5 py-3 shadow-2xl">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-wider">{reconnecting ? 'Reconnecting…' : playerState.isLoading ? 'Loading…' : 'Buffering…'}</span>
            </div>
          </div>
        )}

        {playerState.error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/95 p-6 text-center z-30">
            <div className="max-w-md space-y-3"><AlertTriangle className="h-8 w-8 text-destructive mx-auto" /><h4 className="font-semibold text-foreground text-sm">Playback Error</h4><p className="text-xs text-muted-foreground font-mono">{playerState.error}</p></div>
          </div>
        )}

        {!playerState.isPlaying && !playerState.isLoading && !playerState.error && !reconnecting && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-white/15 flex items-center justify-center bg-black/40 backdrop-blur-xs transition-transform hover:scale-105">
              <div className="w-0 h-0 border-t-[14px] border-t-transparent border-l-[22px] border-l-white border-b-[14px] border-b-transparent ml-2"></div>
            </div>
          </div>
        )}
      </div>

      {flashMessage && (
        <div className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded border border-border bg-popover/95 px-3.5 py-1.5 text-xs font-mono font-medium text-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
          <span>{flashMessage}</span>
        </div>
      )}

      {showStatsOverlay && <VideoTechnicalStats asset={asset} playerState={playerState} fps={null} onClose={() => setShowStatsOverlay(false)} />}

      <VideoOverlayActions
        videoRef={videoRef}
        currentTime={playerState.currentTime}
        fps={null}
        onAddCuePoint={(newCue) => { onCuePointAdd?.(newCue); }}
        loopRange={playerState.loopRange}
        onSetLoopRange={(range) => setPlayerState((prev) => ({ ...prev, loopRange: range }))}
        videoFilter={videoFilter}
        onSetVideoFilter={setVideoFilter}
        showStatsOverlay={showStatsOverlay}
        onToggleStatsOverlay={() => setShowStatsOverlay(!showStatsOverlay)}
        onFlashNotification={flashNotification}
      />

      <div className={`mt-auto w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent p-5 pb-3 transition-opacity duration-300 ${controlsVisible || !playerState.isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={(e) => e.stopPropagation()}>
        <VideoProgressBar currentTime={playerState.currentTime} duration={playerState.duration} buffered={playerState.buffered} cuePoints={cuePoints} loopRange={playerState.loopRange} onSeek={handleSeek} fps={null} />

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <button onClick={togglePlay} className="text-white hover:text-primary transition-colors focus-visible:outline-none" title={playerState.isPlaying ? 'Pause (Space or K)' : 'Play (Space or K)'} aria-label={playerState.isPlaying ? 'Pause video' : 'Play video'}>
                {playerState.isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={toggleMute} className="text-white/70 hover:text-white transition-colors" title="Mute (M)">
                  {playerState.isMuted || playerState.volume === 0 ? <VolumeX className="w-4 h-4 text-destructive" /> : playerState.volume < 0.5 ? <Volume1 className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="w-16 sm:w-20 h-1 bg-white/20 rounded-full relative cursor-pointer group/vol">
                  <input type="range" min="0" max="1" step="0.05" value={playerState.isMuted ? 0 : playerState.volume} onChange={(e) => handleVolumeSlide(parseFloat(e.target.value))} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" aria-label="Volume slider" />
                  <div className="absolute left-0 top-0 h-full bg-white rounded-full" style={{ width: `${(playerState.isMuted ? 0 : playerState.volume) * 100}%` }}></div>
                </div>
              </div>
            </div>
            <div className="font-mono text-xs flex items-center gap-1.5">
              <span className="text-white font-semibold">{formatTime(playerState.currentTime, playerState.duration >= 3600)}</span>
              <span className="text-white/30">/</span>
              <span className="text-white/60">{formatTime(playerState.duration, playerState.duration >= 3600)}</span>
            </div>
          </div>
<div className="flex items-center gap-3 sm:gap-4">
             <form onSubmit={handleInlineSeekSubmit} className="hidden sm:flex items-center bg-muted rounded px-2 py-1 gap-1.5 border border-border">
               <span className="text-[10px] text-muted-foreground font-mono shrink-0">SEEK:</span>
               <span className="text-[10px] font-mono text-primary w-16">{formatTime(playerState.currentTime)}</span>
             </form>
             <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className={`transition-colors ${showSettingsMenu ? 'text-primary' : 'text-white/70 hover:text-white'}`} title="Playback Settings">
               <Settings className="w-4 h-4" />
             </button>
            <button onClick={togglePictureInPicture} className="text-white/70 hover:text-white transition-colors" title="Picture in Picture (P)">
              <PictureInPicture className="w-4 h-4" />
            </button>
            <button onClick={toggleTheaterMode} className={`transition-colors hidden sm:block ${playerState.isTheaterMode ? 'text-primary' : 'text-white/70 hover:text-white'}`} title="Theater Mode (T)">
              <Tv className="w-4 h-4" />
            </button>
            <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors" title={playerState.isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}>
              {playerState.isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowShortcutsModal(true)} className="text-white/70 hover:text-white transition-colors" title="Keyboard shortcuts (?)">
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showSettingsMenu && (
          <div className="absolute right-5 bottom-20 w-52 rounded border border-border bg-popover p-3 text-foreground shadow-2xl z-50 animate-in fade-in zoom-in-95">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono pb-1.5 border-b border-border">Playback Rate</div>
            <div className="grid grid-cols-4 gap-1">
              {playbackSpeeds.map((spd) => (
                <button key={spd} onClick={() => setPlaybackSpeed(spd)} className={`rounded py-0.5 text-xs font-mono transition-colors ${playerState.playbackRate === spd ? 'bg-primary font-bold text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{spd}x</button>
              ))}
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground font-mono pt-2 pb-1 border-t border-border">Inspection</div>
            <button onClick={() => { setShowStatsOverlay(true); setShowSettingsMenu(false); }} className="mt-1 flex w-full items-center justify-between rounded px-2 py-1 text-xs font-mono text-muted-foreground hover:bg-muted hover:text-foreground"><span>Diagnostics HUD</span><Sliders className="h-3 w-3" /></button>
          </div>
        )}
      </div>

      <SeekToTimeModal isOpen={showSeekModal} onClose={() => setShowSeekModal(false)} currentTime={playerState.currentTime} duration={playerState.duration} fps={null} cuePoints={cuePoints} onSeek={handleSeek} />
      <KeyboardShortcutsModal isOpen={showShortcutsModal} onClose={() => setShowShortcutsModal(false)} fpsKnown={false} />
    </div>
  );
}
