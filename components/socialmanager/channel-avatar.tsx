"use client";

import { useState, type ReactNode } from "react";

import { channelAvatarUrl } from "@/lib/social/avatar-url";

interface ChannelAvatarProps {
  nanoid: string;
  /** The stored picture URL. Its presence only gates whether we try at all —
   *  it is never the URL that gets fetched, because by the time anyone sees it
   *  it has usually expired. */
  pictureUrl: string;
  workspace: string;
  /** Classes for the `<img>`. */
  className: string;
  /**
   * The caller's own initials block, rendered when there is no picture or the
   * load fails. Passed in rather than styled here because every site has a
   * deliberate look of its own — a gradient chip in the composer, a
   * translucent tile in the hero.
   */
  fallback: ReactNode;
  alt?: string;
}

/**
 * A channel avatar that fails closed.
 *
 * Two ways an avatar can be missing, and the old truthiness check in each of
 * these seven sites caught only the first: the column is empty, or the URL is
 * present but no longer resolves. Because Meta's picture links expire after a
 * few days, the second is the common case — and it rendered as a broken image
 * rather than as the caller's fallback. This treats a failed load the same as a
 * missing URL.
 */
export function ChannelAvatar({
  nanoid,
  pictureUrl,
  workspace,
  className,
  fallback,
  alt = "",
}: ChannelAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (!pictureUrl || failed) return <>{fallback}</>;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- the source is a
    // short-lived signed CDN link behind a redirecting endpoint, so Next's
    // optimiser would only add a cache layer between us and a link that is
    // about to expire.
    <img
      src={channelAvatarUrl(nanoid, workspace)}
      alt={alt}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
