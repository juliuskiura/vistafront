"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Asset } from "@/lib/api";
import type { VideoPlayerState } from "@/lib/apptypes/media_libary";

/** Nominal frame duration, used by the frame-step shortcut. */
const FRAME_SECONDS = 1 / 30;

export interface VideoPlaybackApi {
  playerState: VideoPlayerState;
  setLoopRange: (range: { start: number; end: number } | null) => void;
  handleLoadedMetadata: (info: { duration: number; width: number; height: number }) => void;
  handleTimeUpdate: () => void;
  handlePlayState: () => void;
  handleVolumeChange: () => void;
  handleWaiting: () => void;
  handlePlaying: () => void;
  togglePlay: () => void;
  handleSeek: (time: number) => void;
  handleSkip: (seconds: number) => void;
  handleStepFrame: (frames: number) => void;
  handleVolumeSlide: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackSpeed: (rate: number) => void;
  toggleFullscreen: () => void;
  togglePictureInPicture: () => void;
  toggleTheaterMode: () => void;
}

/**
 * The media-element half of the player: what the video is doing right now,
 * and every command that can be issued to it.
 */
export function useVideoPlaybackState(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  asset: Asset,
  flashNotification: (message: string) => void,
): VideoPlaybackApi {
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

  // The loop range is only ever written through `setLoopRange`, so the ref is
  // the single source of truth the time-update handler reads.
  const loopRangeRef = useRef<{ start: number; end: number } | null>(null);

  const handleLoadedMetadata = useCallback(
    (info: { duration: number; width: number; height: number }) => {
      setPlayerState((prev) => ({ ...prev, duration: info.duration, isLoading: false }));
    },
    [],
  );

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const loopRange = loopRangeRef.current;
    if (loopRange) {
      if (
        video.currentTime >= loopRange.end ||
        video.currentTime < loopRange.start
      ) {
        video.currentTime = loopRange.start;
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
  }, [videoRef]);

  const handlePlayState = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerState((prev) => ({
      ...prev,
      isPlaying: !video.paused,
      // A paused player is never "buffering" — the stall overlay would sit on
      // top of the play button forever.
      isBuffering: video.paused ? false : prev.isBuffering,
    }));
  }, [videoRef]);

  const handleVolumeChange = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setPlayerState((prev) => ({
      ...prev,
      volume: video.volume,
      isMuted: video.muted,
    }));
  }, [videoRef]);

  const handleWaiting = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isBuffering: true }));
  }, []);

  const handlePlaying = useCallback(() => {
    setPlayerState((prev) => ({
      ...prev,
      isBuffering: false,
      isLoading: false,
      isPlaying: true,
    }));
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => {
          setPlayerState((prev) => ({ ...prev, isPlaying: true }));
          flashNotification("Play");
        })
        .catch(() => {});
    } else {
      video.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      flashNotification("Pause");
    }
  }, [flashNotification, videoRef]);

  const handleSeek = useCallback(
    (targetTime: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(
        0,
        Math.min(video.duration || asset.duration_seconds || 0, targetTime),
      );
      video.currentTime = clamped;
      setPlayerState((prev) => ({ ...prev, currentTime: clamped }));
    },
    [asset.duration_seconds, videoRef],
  );

  const handleSkip = useCallback(
    (seconds: number) => {
      const video = videoRef.current;
      if (!video) return;
      handleSeek(video.currentTime + seconds);
      flashNotification(seconds > 0 ? `+${seconds}s` : `${seconds}s`);
    },
    [handleSeek, flashNotification, videoRef],
  );

  const handleStepFrame = useCallback(
    (frames: number) => {
      const video = videoRef.current;
      if (!video) return;
      handleSeek(video.currentTime + frames * FRAME_SECONDS);
      flashNotification(frames > 0 ? "Step +1 Frame" : "Step -1 Frame");
    },
    [handleSeek, flashNotification, videoRef],
  );

  const handleVolumeSlide = useCallback(
    (value: number) => {
      const video = videoRef.current;
      if (!video) return;
      const clamped = Math.max(0, Math.min(1, value));
      video.volume = clamped;
      video.muted = clamped === 0;
      setPlayerState((prev) => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
    },
    [videoRef],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setPlayerState((prev) => ({ ...prev, isMuted: video.muted }));
    flashNotification(
      video.muted ? "Muted" : `Volume ${Math.round(video.volume * 100)}%`,
    );
  }, [flashNotification, videoRef]);

  const setPlaybackSpeed = useCallback(
    (rate: number) => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = rate;
      setPlayerState((prev) => ({ ...prev, playbackRate: rate }));
      flashNotification(`Speed: ${rate}x`);
    },
    [flashNotification, videoRef],
  );

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
  }, [containerRef]);

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
  }, [videoRef]);

  const toggleTheaterMode = useCallback(() => {
    setPlayerState((prev) => ({ ...prev, isTheaterMode: !prev.isTheaterMode }));
  }, []);

  const setLoopRange = useCallback((range: { start: number; end: number } | null) => {
    loopRangeRef.current = range;
    setPlayerState((prev) => ({ ...prev, loopRange: range }));
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setPlayerState((prev) => ({
        ...prev,
        isFullscreen: !!document.fullscreenElement,
      }));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  return {
    playerState,
    setLoopRange,
    handleLoadedMetadata,
    handleTimeUpdate,
    handlePlayState,
    handleVolumeChange,
    handleWaiting,
    handlePlaying,
    togglePlay,
    handleSeek,
    handleSkip,
    handleStepFrame,
    handleVolumeSlide,
    toggleMute,
    setPlaybackSpeed,
    toggleFullscreen,
    togglePictureInPicture,
    toggleTheaterMode,
  };
}
