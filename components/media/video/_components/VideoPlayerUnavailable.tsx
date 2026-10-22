"use client";

import { AlertTriangle } from "@/lib/icons";

interface VideoPlayerUnavailableProps {
  name: string;
  originalFileUrl: string | null;
}

/**
 * Shown when the asset has no source the browser can play: no `stream_url`, no
 * original file, no adaptive manifest.
 */
export function VideoPlayerUnavailable({
  name,
  originalFileUrl,
}: VideoPlayerUnavailableProps) {
  return (
    <div className="max-w-md px-6 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
      <h4 className="mt-3 font-semibold text-foreground text-sm">
        Video source unavailable
      </h4>
      <p className="mt-1 text-xs text-muted-foreground">
        No video source or supported media stream was found for{" "}
        <span className="font-mono text-foreground">{name}</span>. Download the
        original file to view it.
      </p>
      {originalFileUrl && (
        <a
          href={originalFileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-mono text-primary hover:bg-primary/20"
        >
          Open original file
        </a>
      )}
    </div>
  );
}
