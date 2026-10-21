import type { ComponentType } from "react";
import {
  BlueskyIcon,
  FacebookIcon,
  GoogleBusinessIcon,
  InstagramIcon,
  LinkedinIcon,
  MastodonIcon,
  PinterestIcon,
  StartPageIcon,
  ThreadsIcon,
  TiktokIcon,
  XIcon,
  YoutubeIcon,
  type SocialIconProps,
} from "@/components/social-icons";
import { Globe } from "@/lib/icons";

/**
 * Maps a social link's `name` to its network icon.
 *
 * A link's `name` is free text — the backend derives it from the URL host
 * (`facebook.com` → "Facebook") but the user can type anything, so the
 * lookup has to be forgiving: case-insensitive and substring-tolerant, so
 * "Facebook page" or "facebook" both resolve to Facebook.
 *
 * The icons themselves live in `components/social-icons.tsx`; this module is
 * only the name → component mapping, which is what the CRM record header
 * needs.
 */
export type SocialIconComponent = ComponentType<SocialIconProps>;

const ICON_BY_KEY: Record<string, SocialIconComponent> = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  linkedin: LinkedinIcon,
  youtube: YoutubeIcon,
  x: XIcon,
  twitter: XIcon,
  pinterest: PinterestIcon,
  tiktok: TiktokIcon,
  threads: ThreadsIcon,
  mastodon: MastodonIcon,
  bluesky: BlueskyIcon,
  start_page: StartPageIcon,
  google_business: GoogleBusinessIcon,
};

/** The generic fallback for a link we cannot identify. */
export const GENERIC_SOCIAL_ICON: SocialIconComponent = ({
  className,
  size,
  ...rest
}: SocialIconProps) => <Globe className={className} size={size} {...rest} />;

/**
 * Resolve the icon for a social link name.
 *
 * Returns the generic globe when the name matches nothing — a link the user
 * typed by hand still has to render as *something*, and a missing icon
 * would leave an empty gap in the header.
 */
export function resolveSocialIcon(name?: string | null): SocialIconComponent {
  if (!name) return GENERIC_SOCIAL_ICON;
  const key = name.trim().toLowerCase();
  if (!key) return GENERIC_SOCIAL_ICON;

  const exact = ICON_BY_KEY[key];
  if (exact) return exact;

  // Substring match, longest key first so "google business" wins over a
  // stray "google" and "start page" over "start".
  const match = Object.keys(ICON_BY_KEY)
    .sort((a, b) => b.length - a.length)
    .find((candidate) => key.includes(candidate));
  return match ? ICON_BY_KEY[match] : GENERIC_SOCIAL_ICON;
}
