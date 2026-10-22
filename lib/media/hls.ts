import Hls from "hls.js";
import { resolveHlsManifest, type PlaybackSourceInput } from "./playback-source";

/** Fatal errors hls.js may recover from on its own. */
const MAX_NETWORK_RETRIES = 3;
const MAX_MEDIA_RETRIES = 2;

export interface HlsHandle {
  detach: () => void;
}

/**
 * True when the asset is delivered as an adaptive manifest rather than as a
 * single progressive file.
 *
 * The manifest is looked for by URL, by extension and in `extra` — the
 * container `format` is not a signal (see `resolveHlsManifest`).
 */
export function isHlsAsset(
  asset: PlaybackSourceInput | null | undefined,
): boolean {
  return resolveHlsManifest(asset) !== null;
}

export function isHlsSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    Hls.isSupported() ||
    Boolean(document.createElement("video").canPlayType("application/vnd.apple.mpegurl"))
  );
}

function isSameOrigin(url: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return new URL(url, window.location.href).origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Attach an adaptive manifest to a video element.
 *
 * hls.js owns the network from here: it parses the master playlist, picks a
 * rendition that fits the link, and swaps between them. Fatal errors are
 * recovered a bounded number of times — an unbounded `startLoad()` loop turns
 * a dead stream into an infinite spinner instead of a failure.
 */
export function attachHls(
  video: HTMLVideoElement,
  src: string,
  onError?: (error: string) => void,
): HlsHandle {
  if (Hls.isSupported()) {
    const hls = new Hls({
      enableWorker: true,
      // Never fetch a rendition larger than the element needs.
      capLevelToPlayerSize: true,
      xhrSetup: (xhr) => {
        // Credentials only travel same-origin: a cross-origin manifest that
        // answers without `Access-Control-Allow-Credentials` is rejected by
        // the browser when credentials are attached.
        xhr.withCredentials = isSameOrigin(src);
      },
    });

    let networkRetries = 0;
    let mediaRetries = 0;

    const fail = (message: string) => {
      hls.destroy();
      onError?.(message);
    };

    hls.loadSource(src);
    hls.attachMedia(video);

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          if (networkRetries >= MAX_NETWORK_RETRIES) {
            fail("The adaptive stream could not be fetched.");
            return;
          }
          networkRetries += 1;
          hls.startLoad();
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          if (mediaRetries >= MAX_MEDIA_RETRIES) {
            fail("The adaptive stream could not be decoded.");
            return;
          }
          mediaRetries += 1;
          hls.recoverMediaError();
          break;
        default:
          fail(`HLS playback error: ${data.details || data.type}`);
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
