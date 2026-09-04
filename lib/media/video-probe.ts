export interface VideoProbeResult {
  duration: number;
  width: number;
  height: number;
  posterBlob: Blob | null;
}

const MAX_POSTER_EDGE = 1280;
const POSTER_QUALITY = 0.8;

export async function probeVideoFile(file: File): Promise<VideoProbeResult> {
  const url = URL.createObjectURL(file);

  try {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    await new Promise<void>((resolve, reject) => {
      const onLoaded = () => resolve();
      const onError = () => reject(new Error("Could not read video metadata"));
      video.addEventListener("loadedmetadata", onLoaded, { once: true });
      video.addEventListener("error", onError, { once: true });
    });

    const duration = video.duration && isFinite(video.duration) ? video.duration : 0;
    const width = video.videoWidth || 0;
    const height = video.videoHeight || 0;

    let posterBlob: Blob | null = null;
    const seekTarget = Math.min(1, duration / 2);
    if (seekTarget >= 0 && width > 0 && height > 0) {
      posterBlob = await capturePoster(video, seekTarget);
    }

    return { duration, width, height, posterBlob };
  } finally {
    URL.revokeObjectURL(url);
  }
}

function capturePoster(
  video: HTMLVideoElement,
  seekTo: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      try {
        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const scale = Math.min(1, MAX_POSTER_EDGE / Math.max(vw, vh));
        const cw = Math.max(1, Math.round(vw * scale));
        const ch = Math.max(1, Math.round(vh * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(video, 0, 0, cw, ch);
        canvas.toBlob(
          (blob) => resolve(blob),
          "image/jpeg",
          POSTER_QUALITY,
        );
      } catch {
        resolve(null);
      }
    };
    const prevTime = video.currentTime;
    const onError = () => resolve(null);
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    try {
      video.currentTime = seekTo;
    } catch {
      resolve(null);
    }
    setTimeout(() => resolve(null), 4000);
    void prevTime;
  });
}
