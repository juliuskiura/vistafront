"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assetOriginalFileUrl } from "@/lib/media/playback-source";
import { toSameOrigin } from "@/lib/media/video-utils";
import { DoubleClickRipple, VideoPlayerStage } from "./_components/VideoPlayerStage";
import { VideoPlayerControls } from "./_components/VideoPlayerControls";
import { VideoPlayerUnavailable } from "./_components/VideoPlayerUnavailable";
import { usePlaybackSource } from "./_hooks/usePlaybackSource";
import { useVideoPlaybackState } from "./_hooks/useVideoPlaybackState";
import { useVideoKeyboardShortcuts } from "./_hooks/useVideoKeyboardShortcuts";
import { VideoOverlayActions } from "./VideoOverlayActions";
import { SeekToTimeModal } from "./SeekToTimeModal";
import { KeyboardShortcutsModal } from "./KeyboardShortcutsModal";
import { VideoTechnicalStats } from "./VideoTechnicalStats";
import type { Asset } from "@/lib/api";
import type { VideoCuePoint, VideoPlayerState } from "@/lib/apptypes/media_libary";

interface VideoPlayerProps {
  asset: Asset;
  /** The active workspace; the playback link is renewed per workspace. */
  workspaceDomain: string;
  onCuePointAdd?: (cue: VideoCuePoint) => void;
  cuePoints?: VideoCuePoint[];
  onLoadedMetadata?: (info: { duration: number; width: number; height: number }) => void;
  className?: string;
}

export function VideoPlayer({
  asset,
  workspaceDomain,
  onCuePointAdd,
  cuePoints = [],
  onLoadedMetadata,
  className,
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playback = usePlaybackSource(asset, workspaceDomain);
  const { videoRef } = playback;
  const {
    source,
    status,
    error: sourceError,
    recovering,
    onLoadedMetadata: onSourceLoadedMetadata,
    onError: onSourceError,
    onCanPlay: onSourceCanPlay,
    retry: onSourceRetry,
  } = playback;

  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSeekModal, setShowSeekModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showStatsOverlay, setShowStatsOverlay] = useState(false);
  const [videoFilter, setVideoFilter] = useState("none");
  const [doubleClickRipple, setDoubleClickRipple] = useState<"left" | "right" | null>(null);

  const flashNotification = useCallback((msg: string) => {
    setFlashMessage(msg);
    if (flashToastTimer.current) clearTimeout(flashToastTimer.current);
    flashToastTimer.current = setTimeout(() => {
      setFlashMessage(null);
    }, 2200);
  }, []);

  useEffect(
    () => () => {
      if (flashToastTimer.current) clearTimeout(flashToastTimer.current);
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    },
    [],
  );

  const playbackApi = useVideoPlaybackState(videoRef, containerRef, asset, flashNotification);
  const { playerState } = playbackApi;

  // The source controller owns the failure state; the shared player state
  // carries it so every consumer reads the same value.
  const displayState: VideoPlayerState = { ...playerState, error: sourceError };

  const handleElementLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const info = {
      duration: video.duration || 0,
      width: video.videoWidth || 0,
      height: video.videoHeight || 0,
    };
    playbackApi.handleLoadedMetadata(info);
    onSourceLoadedMetadata();
    onLoadedMetadata?.(info);
  }, [onLoadedMetadata, onSourceLoadedMetadata, playbackApi, videoRef]);

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

  const handleKeyDown = useVideoKeyboardShortcuts(videoRef, playerState.duration, {
    togglePlay: playbackApi.togglePlay,
    skip: playbackApi.handleSkip,
    seek: playbackApi.handleSeek,
    stepFrame: playbackApi.handleStepFrame,
    changeVolume: (delta) => {
      const video = videoRef.current;
      if (!video) return;
      const next = Math.max(0, Math.min(1, video.volume + delta));
      playbackApi.handleVolumeSlide(next);
      flashNotification(`Volume ${Math.round(next * 100)}%`);
    },
    toggleMute: playbackApi.toggleMute,
    toggleFullscreen: playbackApi.toggleFullscreen,
    toggleTheaterMode: playbackApi.toggleTheaterMode,
    togglePictureInPicture: playbackApi.togglePictureInPicture,
    openSeekDialog: () => setShowSeekModal(true),
    openShortcutsDialog: () => setShowShortcutsModal(true),
    flash: flashNotification,
  });

  const handleVideoAreaClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      containerRef.current?.focus();
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const w = rect.width;
      if (e.detail === 2) {
        if (clickX < w * 0.35) {
          playbackApi.handleSkip(-10);
          setDoubleClickRipple("left");
          setTimeout(() => setDoubleClickRipple(null), 500);
        } else if (clickX > w * 0.65) {
          playbackApi.handleSkip(10);
          setDoubleClickRipple("right");
          setTimeout(() => setDoubleClickRipple(null), 500);
        } else {
          playbackApi.toggleFullscreen();
        }
      } else if (e.detail === 1) {
        playbackApi.togglePlay();
      }
    },
    [playbackApi],
  );

  const originalFileUrl = assetOriginalFileUrl(asset);

  if (source.kind === "unsupported") {
    return (
      <div
        ref={containerRef}
        className={`relative flex items-center justify-center rounded border border-border bg-black min-h-[360px] ${className ?? ""}`}
        tabIndex={0}
        role="region"
        aria-label={`Video player for ${asset.name}`}
        onKeyDown={handleKeyDown}
      >
        <VideoPlayerUnavailable name={asset.name} originalFileUrl={originalFileUrl} />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative group select-none overflow-hidden rounded border border-border bg-black transition-all duration-300 ${
        playerState.isTheaterMode ? "w-full max-h-[85vh]" : "w-full max-h-[75vh]"
      } ${className ?? ""}`}
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => {
        if (playerState.isPlaying) {
          setControlsVisible(false);
          setShowSettingsMenu(false);
        }
      }}
      tabIndex={0}
      role="region"
      aria-label={`Video player for ${asset.name}`}
      onKeyDown={handleKeyDown}
    >
      <div className="relative flex h-full w-full flex-col">
        <VideoPlayerStage
          videoRef={videoRef}
          poster={toSameOrigin(asset.thumbnail) || undefined}
          filter={videoFilter}
          isPlaying={playerState.isPlaying}
          isLoading={status === "loading"}
          isBuffering={playerState.isBuffering}
          recovering={recovering}
          error={sourceError}
          currentTime={playerState.currentTime}
          bufferAhead={Math.max(0, playerState.bufferedEnd - playerState.currentTime)}
          originalFileUrl={originalFileUrl}
          onLoadedMetadata={handleElementLoadedMetadata}
          onError={onSourceError}
          onCanPlay={onSourceCanPlay}
          onTimeUpdate={playbackApi.handleTimeUpdate}
          onPlayState={playbackApi.handlePlayState}
          onVolumeChange={playbackApi.handleVolumeChange}
          onWaiting={playbackApi.handleWaiting}
          onPlaying={playbackApi.handlePlaying}
          onActivate={handleVideoAreaClick}
          onOpenSeek={() => setShowSeekModal(true)}
          onRetry={onSourceRetry}
        />

        <DoubleClickRipple side={doubleClickRipple} />

        {flashMessage && (
          <div className="pointer-events-none absolute top-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 rounded border border-border bg-popover/95 px-3.5 py-1.5 text-xs font-mono font-medium text-foreground shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95">
            <span>{flashMessage}</span>
          </div>
        )}

        {showStatsOverlay && (
          <VideoTechnicalStats
            asset={asset}
            playerState={displayState}
            fps={null}
            onClose={() => setShowStatsOverlay(false)}
          />
        )}

        <VideoOverlayActions
          videoRef={videoRef}
          currentTime={playerState.currentTime}
          fps={null}
          onAddCuePoint={(newCue) => {
            onCuePointAdd?.(newCue);
          }}
          loopRange={playerState.loopRange}
          onSetLoopRange={playbackApi.setLoopRange}
          videoFilter={videoFilter}
          onSetVideoFilter={setVideoFilter}
          showStatsOverlay={showStatsOverlay}
          onToggleStatsOverlay={() => setShowStatsOverlay((open) => !open)}
          onFlashNotification={flashNotification}
        />

        <VideoPlayerControls
          playerState={displayState}
          cuePoints={cuePoints}
          controlsVisible={controlsVisible}
          showSettings={showSettingsMenu}
          onSeek={playbackApi.handleSeek}
          onTogglePlay={playbackApi.togglePlay}
          onToggleMute={playbackApi.toggleMute}
          onVolumeChange={playbackApi.handleVolumeSlide}
          onToggleFullscreen={playbackApi.toggleFullscreen}
          onTogglePictureInPicture={playbackApi.togglePictureInPicture}
          onToggleTheater={playbackApi.toggleTheaterMode}
          onSetPlaybackRate={playbackApi.setPlaybackSpeed}
          onToggleSettings={() => setShowSettingsMenu((open) => !open)}
          onOpenShortcuts={() => setShowShortcutsModal(true)}
          onOpenStats={() => {
            setShowStatsOverlay(true);
            setShowSettingsMenu(false);
          }}
        />
      </div>

      <SeekToTimeModal
        isOpen={showSeekModal}
        onClose={() => setShowSeekModal(false)}
        currentTime={playerState.currentTime}
        duration={playerState.duration}
        fps={null}
        cuePoints={cuePoints}
        onSeek={playbackApi.handleSeek}
      />
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        fpsKnown={false}
      />
    </div>
  );
}
