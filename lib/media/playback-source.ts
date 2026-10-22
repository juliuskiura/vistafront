import { toSameOrigin } from "./video-utils";

/**
 * How a video is delivered to the browser.
 *
 * - `progressive` — one file, one bitrate. The browser downloads it start to
 *   finish and can only stall when the connection is slower than playback.
 * - `hls` — an adaptive master playlist plus variant playlists. The player
 *   picks a rendition that fits the link and switches between them.
 * - `unsupported` — nothing playable was found for this asset.
 */
export type PlaybackKind = "progressive" | "hls" | "unsupported";

export interface PlaybackSource {
  kind: PlaybackKind;
  src: string | null;
}

/** The fields of an asset that decide how it is played. */
export interface PlaybackSourceInput {
  stream_url?: string | null;
  original_file?: string | null;
  extension?: string | null;
  /** An explicit adaptive manifest URL, if the API advertises one. */
  manifestUrl?: string | null;
  extra?: Record<string, unknown> | null;
}

const HLS_EXTENSION = "m3u8";
const MANIFEST_PATTERN = /\.m3u8($|\?)/i;

/** Extra fields an API may use to advertise an adaptive manifest. */
const MANIFEST_EXTRA_KEYS = ["hls_url", "hls_manifest_url", "manifest_url"];

/**
 * The adaptive manifest URL an API advertises on `extra`, if any.
 *
 * Returned as a plain string so that it can be used as an effect dependency:
 * an `extra` object is replaced whenever the asset row is refetched, and a
 * dependency on it would tear the playback down on every refetch.
 */
export function extractManifestUrl(
  extra: Record<string, unknown> | null | undefined,
): string | null {
  if (!extra) return null;
  for (const key of MANIFEST_EXTRA_KEYS) {
    const value = extra[key];
    if (typeof value === "string" && value) return value;
  }
  return null;
}

/**
 * The adaptive manifest for an asset, or `null` when it has none.
 *
 * A manifest is recognised by its URL (`.m3u8`), by the asset extension, or by
 * an explicit URL the API puts on `extra`. Nothing else counts: the `format`
 * field describes the *container* of the stored file ("mp4", "webm"), so
 * matching on it could only ever produce a false positive.
 */
export function resolveHlsManifest(
  asset: PlaybackSourceInput | null | undefined,
): string | null {
  if (!asset) return null;

  if (asset.extension?.toLowerCase() === HLS_EXTENSION) {
    return toSameOrigin(asset.stream_url) || toSameOrigin(asset.original_file);
  }

  const candidates = [
    asset.manifestUrl ?? extractManifestUrl(asset.extra) ?? "",
    asset.stream_url ?? "",
    asset.original_file ?? "",
  ];

  for (const candidate of candidates) {
    if (candidate && MANIFEST_PATTERN.test(candidate)) {
      return toSameOrigin(candidate);
    }
  }

  return null;
}

/**
 * Where the player should read this asset from.
 *
 * `original_file` is preferred over `stream_url`. `original_file` is the
 * presigned object-storage URL the API hands back with the asset — the
 * browser plays it directly, and the object store serves it with `Range`
 * support. `stream_url` points at the renewable `/stream/` endpoint, but that
 * endpoint authorises on *ownership* rather than on workspace membership, so
 * it answers `403` to a member who is merely a member. `stream_url` is kept as
 * the fallback for assets whose `original_file` is empty.
 */
export function resolvePlaybackSource(
  asset: PlaybackSourceInput | null | undefined,
): PlaybackSource {
  if (!asset) return { kind: "unsupported", src: null };

  const manifest = resolveHlsManifest(asset);
  if (manifest) return { kind: "hls", src: manifest };

  const progressive =
    toSameOrigin(asset.original_file) || toSameOrigin(asset.stream_url);
  if (!progressive) return { kind: "unsupported", src: null };

  return { kind: "progressive", src: progressive };
}

/**
 * Cache-bust a URL so the browser does not replay a cached response.
 *
 * Used for the adaptive manifest: a manifest is stable, so a fatal network
 * error is recovered by asking for it again — and the cache-buster makes sure
 * that "again" is really "again".
 */
export function withFreshPlaybackUrl(src: string): string {
  const separator = src.includes("?") ? "&" : "?";
  return `${src}${separator}rt=${Date.now()}`;
}

/**
 * The original file of an asset, as the API hands it back.
 *
 * It is a presigned object-storage link that expires after an hour. It is the
 * only link to the file that works for every member of the workspace: the
 * `/download/` and `/stream/` endpoints authorise on *ownership*, so they
 * answer `403` to a member who is not the uploader.
 */
export function assetOriginalFileUrl(
  asset: { original_file?: string | null } | null | undefined,
): string | null {
  return toSameOrigin(asset?.original_file);
}
