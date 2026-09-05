import Hls from "hls.js";

export function isHlsAsset(asset: {
  original_file?: string | null;
  stream_url?: string | null;
  extension?: string;
  format?: string;
}): boolean {
  if (!asset) return false;
  const url = asset.original_file || "";
  const streamUrl = asset.stream_url || "";
  return (
    /\.m3u8($|\?)/i.test(url) ||
    /\.m3u8($|\?)/i.test(streamUrl) ||
    asset.extension?.toLowerCase() === "m3u8" ||
    /hls/i.test(asset.format || "")
  );
}

export function isHlsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    Hls.isSupported() ||
    Boolean(document.createElement("video").canPlayType("application/vnd.apple.mpegurl"))
  );
}

export interface HlsHandle {
  detach: () => void;
}

export function attachHls(
  video: HTMLVideoElement,
  src: string,
  onError?: (error: string) => void,
): HlsHandle {
  if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      xhrSetup: (xhr) => {
        xhr.withCredentials = true;
      },
    });
    hls.loadSource(src);
    hls.attachMedia(video);
    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          hls.startLoad();
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          hls.recoverMediaError();
          break;
        default:
          hls.destroy();
          onError?.(`HLS playback error: ${data.details || data.type}`);
          break;
      }
    });
    return {
      detach: () => {
        hls.destroy();
      },
    };
  }

  if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = src;
    return {
      detach: () => {
        video.removeAttribute("src");
        video.load();
      },
    };
  }

  onError?.("HLS adaptive streaming is not supported by your browser.");
  return { detach: () => {} };
}
