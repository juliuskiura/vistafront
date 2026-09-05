export interface VideoCuePoint {
  id: string;
  time: number;
  title: string;
  description?: string;
  color?: string;
  type: "chapter" | "marker" | "note";
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffered: TimeRanges | null;
  bufferedEnd: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;
  isPictureInPicture: boolean;
  isTheaterMode: boolean;
  loopRange: { start: number; end: number } | null;
  isLoading: boolean;
  isBuffering: boolean;
  error: string | null;
}

export interface VideoView {
  src: string | null;
  poster: string | null;
  name: string;
  sizeBytes: number | null;
  mimeType: string;
  extension: string;
  container: string | null;
  durationHint: number | null;
  widthHint: number | null;
  heightHint: number | null;
  fps: number | null;
  codec: string | null;
  codecAudio: string | null;
  bitrate: number | null;
}
