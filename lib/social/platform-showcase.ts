import { hasSocialIcon } from "@/components/social-icons";
import type { SocialMediaPlatform } from "@/lib/api/types";
import {
  buildPlatformBrandMap,
  resolveBrandSlug,
} from "@/lib/social/platform-brand";

/**
 * Platform selection for the "Connect Account" showcase card.
 *
 * The card draws one disc per network the workspace can actually connect, so
 * this module answers one question: which brands are on show, and in what
 * order. It is deliberately pure and React-free so the same answer can come
 * from a Server Component, a Client Component, or a test.
 *
 * Two rules do the real work:
 *
 * 1. **A row is a door, a brand is what the user recognises.** `instagramfb`
 *    signs in through Facebook but produces an Instagram channel, so the icon
 *    is looked up by `auth_destination` — see `lib/social/platform-brand`.
 * 2. **An inactive row has nothing to connect.** Drawing it would advertise a
 *    network whose OAuth handshake 404s the moment the user clicks it.
 */

export interface ShowcasePlatform {
  /** Brand slug — the key the icon registry is looked up with. */
  brand: string;
  /** Display name, e.g. "Instagram". */
  name: string;
}

/**
 * Display order for the showcase row.
 *
 * A fixed list rather than the API's order, because the API returns rows in
 * whatever order the database hands back and the card has to look deliberate.
 * The first entries are the networks most workspaces lead with; anything
 * missing from this list is still connectable, it just sorts after everything
 * known — and lands in the "+ More" marker rather than being hidden.
 */
const FEATURED_ORDER: readonly string[] = [
  "facebook",
  "instagram",
  "tiktok",
  "x",
  "linkedin",
  "youtube",
  "pinterest",
  "threads",
  "bluesky",
  "mastodon",
  "google_business",
  "start_page",
];

/**
 * How many platforms get their own disc before the remainder collapses into the
 * "+ More" marker.
 *
 * Six discs plus the marker is the widest the card can get before it starts
 * crowding the banner heading next to it. Lowering this grows the "+ More"
 * count; the card never grows a second row.
 */
export const SHOWCASE_LIMIT = 5;

/** Unknown brands sort last but keep their relative API order (`sort` is stable). */
function rankOf(brand: string): number {
  const index = FEATURED_ORDER.indexOf(brand);
  return index === -1 ? FEATURED_ORDER.length : index;
}

/** `google_business` → `Google Business`, for a platform with no row name. */
function titleCase(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * The connectable brands for a set of platform rows, deduplicated and ordered.
 *
 * Duplicates are collapsed by **brand**, not by row: `instagram` and
 * `instagramfb` are two doors into one destination, and drawing both would put
 * two identical Instagram discs side by side. The label comes from the
 * destination's own row when there is one, so the card reads "Instagram"
 * rather than "Instagram (via Facebook)".
 *
 * Brands with no registered glyph are dropped — an empty hole in the row reads
 * as a rendering bug, and there is no honest way to draw one.
 *
 * @returns Brands in display order. Empty when the workspace has no active,
 *   drawable platform — the caller then renders the title on its own rather
 *   than a row of nothing.
 */
export function selectShowcasePlatforms(
  platforms: readonly SocialMediaPlatform[] | undefined | null,
): ShowcasePlatform[] {
  const brandMap = buildPlatformBrandMap(platforms);
  const nameBySlug = new Map((platforms ?? []).map((p) => [p.slug, p.name]));

  const seen = new Set<string>();
  const picks: ShowcasePlatform[] = [];

  for (const platform of platforms ?? []) {
    if (!platform.is_active) continue;

    const brand = resolveBrandSlug(brandMap, platform.slug);
    if (!brand || seen.has(brand)) continue;
    if (!hasSocialIcon(brand)) continue;

    seen.add(brand);
    picks.push({ brand, name: nameBySlug.get(brand) ?? titleCase(brand) });
  }

  return picks.sort((a, b) => rankOf(a.brand) - rankOf(b.brand));
}
