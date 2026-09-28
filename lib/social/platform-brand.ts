import type { SocialMediaPlatform } from "@/lib/api/types";

/**
 * Platform brand resolution.
 *
 * A `SocialMediaPlatform` row is a *door* into the connect flow, not a brand.
 * The `instagramfb` door is reached through Facebook's dialog but the channel it
 * produces is an Instagram one, so its `auth_destination` is `instagram` while
 * its own `slug` is `instagramfb`.
 *
 * Every icon, colour tone and label lookup in the UI keys off the **brand**,
 * never the door slug — otherwise the door renders as an unbranded text badge
 * ("IF") because no icon is registered under `instagramfb`, and the user
 * cannot tell an Instagram channel from an unrecognised platform.
 *
 * This module is deliberately pure and React-free so the same rule can be used
 * from a Server Component, a Client Component, or a test.
 */

/** Maps a platform row's own slug to the brand slug its UI should wear. */
export type PlatformBrandMap = ReadonlyMap<string, string>;

/**
 * Build the slug → brand map for a workspace's platform rows.
 *
 * A row's brand is its `auth_destination`; the model writes the row's own slug
 * into that column whenever a platform is its own destination, so a plain
 * self-referencing door maps to itself and needs no special case here. A row
 * whose `auth_destination` names a platform that is not in the list still
 * resolves to that name — the icon lookup degrades to a text badge rather than
 * to the door's own slug, which would be actively wrong.
 *
 * @param platforms Platform rows for the active workspace.
 * @returns Read-only map of door slug → brand slug. Empty when there are no rows.
 */
export function buildPlatformBrandMap(
  platforms: readonly SocialMediaPlatform[] | undefined | null,
): PlatformBrandMap {
  const map = new Map<string, string>();
  for (const platform of platforms ?? []) {
    if (!platform?.slug) continue;
    const destination = platform.auth_destination?.trim();
    map.set(platform.slug, destination || platform.slug);
  }
  return map;
}

/**
 * Resolve a platform slug to the brand slug its UI should wear.
 *
 * @param map Map from `buildPlatformBrandMap`, or `undefined` when no platform
 *   rows are loaded yet.
 * @param slug Platform row slug, e.g. `instagramfb`.
 * @returns The brand slug, e.g. `instagram`. Falls back to `slug` when the row
 *   is unknown, so a newly seeded platform degrades to a text badge instead of
 *   rendering the wrong brand.
 */
export function resolveBrandSlug(
  map: PlatformBrandMap | undefined | null,
  slug: string | null | undefined,
): string {
  const raw = (slug ?? "").trim();
  if (!raw) return "";
  return map?.get(raw) || raw;
}
