"use client";

import { useCallback } from "react";

export interface VideoKeyboardActions {
  togglePlay: () => void;
  skip: (seconds: number) => void;
  seek: (time: number) => void;
  stepFrame: (frames: number) => void;
  changeVolume: (delta: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleTheaterMode: () => void;
  togglePictureInPicture: () => void;
  openSeekDialog: () => void;
  openShortcutsDialog: () => void;
  flash: (message: string) => void;
}

const TEXT_ENTRY_TAGS = ["input", "textarea", "select"];

/**
 * Keyboard shortcuts for the player.
 *
 * Typing in a field or typing into an open dialog must never be swallowed by
 * the player, so both cases bail out before the switch runs.
 */
export function useVideoKeyboardShortcuts(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  duration: number,
  actions: VideoKeyboardActions,
): (event: React.KeyboardEvent<HTMLElement>) => void {
  const { flash } = actions;

  return useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      const activeTag = (document.activeElement?.tagName || "").toLowerCase();
      if (TEXT_ENTRY_TAGS.includes(activeTag)) return;
      if (document.querySelector('[data-slot="dialog-content"]')) return;

      const video = videoRef.current;
      if (!video) return;

      const total = video.duration || duration || 0;

      switch (event.key) {
        case " ":
        case "k":
        case "K":
          event.preventDefault();
          actions.togglePlay();
          break;
        case "ArrowLeft":
          event.preventDefault();
          if (event.shiftKey) actions.skip(-1);
          else actions.skip(-5);
          break;
        case "ArrowRight":
          event.preventDefault();
          if (event.shiftKey) actions.skip(1);
          else actions.skip(5);
          break;
        case "j":
        case "J":
          event.preventDefault();
          actions.skip(-10);
          break;
        case "l":
        case "L":
          event.preventDefault();
          actions.skip(10);
          break;
        case ",":
        case "<":
          if (!total || !video.paused) return;
          event.preventDefault();
          actions.stepFrame(-1);
          break;
        case ".":
        case ">":
          if (!total || !video.paused) return;
          event.preventDefault();
          actions.stepFrame(1);
          break;
        case "ArrowUp":
          event.preventDefault();
          actions.changeVolume(0.05);
          break;
        case "ArrowDown":
          event.preventDefault();
          actions.changeVolume(-0.05);
          break;
        case "m":
        case "M":
          event.preventDefault();
          actions.toggleMute();
          break;
        case "f":
        case "F":
          event.preventDefault();
          actions.toggleFullscreen();
          break;
        case "t":
        case "T":
          event.preventDefault();
          actions.toggleTheaterMode();
          break;
        case "p":
        case "P":
          event.preventDefault();
          actions.togglePictureInPicture();
          break;
        case "s":
        case "S":
          event.preventDefault();
          actions.openSeekDialog();
          break;
        case "?":
          event.preventDefault();
          actions.openShortcutsDialog();
          break;
        default: {
          if (!/^[0-9]$/.test(event.key)) return;
          event.preventDefault();
          const percent = parseInt(event.key, 10) / 10;
          actions.seek(total * percent);
          flash(`Jump to ${percent * 100}%`);
        }
      }
    },
    [actions, duration, flash, videoRef],
  );
}
