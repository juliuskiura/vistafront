"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { attachHls, type HlsHandle } from "@/lib/media/hls";
import { useApiFetch } from "@/lib/context";
import {
  extractManifestUrl,
  resolvePlaybackSource,
  withFreshPlaybackUrl,
  type PlaybackSource,
} from "@/lib/media/playback-source";
import type { Asset } from "@/lib/api";

/** How many times the player re-mints the playback URL before giving up. */
const MAX_RECOVERIES = 3;

export type PlaybackStatus = "loading" | "ready" | "error";

export interface PlaybackSourceController {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  source: PlaybackSource;
  status: PlaybackStatus;
  error: string | null;
  /** True while the player is swapping in a freshly minted playback URL. */
  recovering: boolean;
  onLoadedMetadata: () => void;
  onError: () => void;
  onCanPlay: () => void;
  retry: () => void;
}

/**
 * Owns the playback source of a video asset.
 *
 * Three things happen here that the player cannot do on its own:
 *
 * 1. **The source is attached once.** The effect keys off the *source
 *    identity* — the original file, the stream URL, the extension, the
 *    advertised manifest — and not off the asset object. An asset object is
 *    replaced whenever anything about the row changes (a rename, a metadata
 *    edit, a refetch), and re-attaching on those changes tore the file down
 *    mid-playback and restarted the download from byte zero.
 *
 * 2. **A dead source is recovered, not abandoned.** The playback URL is a
 *    presigned object-storage link that expires after an hour. When it dies
 *    mid-playback the player asks the API for the asset again, which mints a
 *    fresh link, and resumes at the position it was at.
 *
 * 3. **The renewal goes through the BFF.** The playback link is only renewed
 *    by `GET /api/media/asset?nanoid=…&workspace=…`, which forwards the
 *    session cookie and the workspace header to the API — the same
 *    authorisation the asset detail page itself uses.
 */
export function usePlaybackSource(
  asset: Asset,
  workspace: string,
): PlaybackSourceController {
  const apiFetch = useApiFetch();
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsHandle | null>(null);
  const sourceRef = useRef<PlaybackSource>({ kind: "unsupported", src: null });
  const resumeAtRef = useRef<number | null>(null);
  const resumePlayingRef = useRef(false);
  const recoveriesRef = useRef(0);

  // Primitives only: the identity of the source must survive a new asset
  // object, otherwise every refetch would restart the download.
  const streamUrl = asset.stream_url ?? null;
  const originalFile = asset.original_file ?? null;
  const extension = asset.extension ?? null;
  const manifestUrl = extractManifestUrl(asset.extra);

  const sourceKey = `${originalFile}|${streamUrl}|${extension}|${manifestUrl}`;

  const source = useMemo<PlaybackSource>(
    () =>
      resolvePlaybackSource({
        stream_url: streamUrl,
        original_file: originalFile,
        extension,
        manifestUrl,
      }),
    [streamUrl, originalFile, extension, manifestUrl],
  );

  // The status of a source is keyed by the source it belongs to, so a new
  // source starts out "loading" without the previous one having to be reset.
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(
    null,
  );
  const [recoveringKey, setRecoveringKey] = useState<string | null>(null);

  const status: PlaybackStatus =
    failure?.key === sourceKey
      ? "error"
      : readyKey === sourceKey
        ? "ready"
        : "loading";
  const error = failure?.key === sourceKey ? failure.message : null;
  const recovering = recoveringKey === sourceKey;

  const detach = useCallback((video: HTMLVideoElement) => {
    hlsRef.current?.detach();
    hlsRef.current = null;
    video.removeAttribute("src");
    video.load();
  }, []);

  const attach = useCallback(
    (video: HTMLVideoElement, next: PlaybackSource, src: string) => {
      hlsRef.current?.detach();
      hlsRef.current = null;

      if (next.kind === "hls") {
        hlsRef.current = attachHls(video, src, (message) => {
          setFailure({ key: sourceKey, message });
          setRecoveringKey(null);
        });
        return;
      }

      video.src = src;
      video.load();
    },
    [sourceKey],
  );

  /**
   * Ask the API for the asset again. The response carries a freshly minted
   * presigned playback URL.
   */
  const requestFreshUrl = useCallback(async (): Promise<string | null> => {
    const query = new URLSearchParams({ nanoid: asset.nanoid, workspace });
    const response = await apiFetch(`/api/media/asset?${query.toString()}`);
    if (!response.ok) return null;
    const fresh = (await response.json()) as Asset;
    return resolvePlaybackSource(fresh).src;
  }, [apiFetch, asset.nanoid, workspace]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    sourceRef.current = source;
    recoveriesRef.current = 0;
    resumeAtRef.current = null;
    resumePlayingRef.current = false;

    if (source.kind === "unsupported" || !source.src) return;

    attach(video, source, source.src);

    return () => {
      detach(video);
    };
  }, [source, sourceKey, attach, detach]);

  const onLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setReadyKey(sourceKey);

    const resumeAt = resumeAtRef.current;
    if (resumeAt == null) return;

    resumeAtRef.current = null;
    setRecoveringKey(null);
    try {
      video.currentTime = resumeAt;
    } catch {}
    if (resumePlayingRef.current) {
      video.play().catch(() => {});
    }
  }, [sourceKey]);

  const onCanPlay = useCallback(() => {
    setRecoveringKey(null);
  }, []);

  const onError = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // Our own teardown: the element has no source left and hls.js is gone.
    if (!video.getAttribute("src") && !hlsRef.current) return;

    const code = video.error?.code;
    if (code === MediaError.MEDIA_ERR_ABORTED) return;

    const current = sourceRef.current;
    const currentSrc = current.src;
    if (!currentSrc) return;

    resumeAtRef.current = video.currentTime || 0;
    resumePlayingRef.current = !video.paused;

    if (recoveriesRef.current >= MAX_RECOVERIES) {
      setRecoveringKey(null);
      setFailure({
        key: sourceKey,
        message:
          "This video could not be played. The playback link could not be refreshed — try downloading the file instead.",
      });
      return;
    }

    recoveriesRef.current += 1;
    setRecoveringKey(sourceKey);
    setFailure(null);

    void (async () => {
      try {
        const freshUrl =
          current.kind === "hls"
            ? withFreshPlaybackUrl(currentSrc)
            : await requestFreshUrl();
        if (!freshUrl) throw new Error("No fresh playback URL");

        // The element may have been torn down while the URL was being minted.
        if (videoRef.current !== video) return;
        attach(video, current, freshUrl);
      } catch {
        if (videoRef.current !== video) return;
        setRecoveringKey(null);
        setFailure({
          key: sourceKey,
          message: "The playback link could not be refreshed. Please try again.",
        });
      }
    })();
  }, [attach, requestFreshUrl, sourceKey]);

  const retry = useCallback(() => {
    const video = videoRef.current;
    const current = sourceRef.current;
    recoveriesRef.current = 0;
    resumeAtRef.current = null;
    resumePlayingRef.current = false;
    setFailure(null);
    setReadyKey(null);
    setRecoveringKey(sourceKey);

    const currentSrc = current.src;
    if (!video || !currentSrc) return;

    void (async () => {
      try {
        const freshUrl =
          current.kind === "hls"
            ? withFreshPlaybackUrl(currentSrc)
            : await requestFreshUrl();
        if (!freshUrl) throw new Error("No fresh playback URL");
        if (videoRef.current !== video) return;
        attach(video, current, freshUrl);
      } catch {
        if (videoRef.current !== video) return;
        setRecoveringKey(null);
        setFailure({
          key: sourceKey,
          message: "The playback link could not be refreshed. Please try again.",
        });
      }
    })();
  }, [attach, requestFreshUrl, sourceKey]);

  return {
    videoRef,
    source,
    status,
    error,
    recovering,
    onLoadedMetadata,
    onError,
    onCanPlay,
    retry,
  };
}
