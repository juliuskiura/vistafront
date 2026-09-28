"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { SocialMediaPlatform } from "@/lib/api/types";
import {
  buildPlatformBrandMap,
  resolveBrandSlug,
  type PlatformBrandMap,
} from "@/lib/social/platform-brand";

interface PlatformBrandContextValue {
  /** Door slug → brand slug map, derived from `auth_destination`. */
  readonly map: PlatformBrandMap;
  /**
   * Resolve a platform row slug to the brand slug its UI should wear.
   * `instagramfb` → `instagram`; an ordinary platform resolves to itself.
   */
  brandOf: (slug: string | null | undefined) => string;
}

const EMPTY: PlatformBrandContextValue = {
  map: new Map(),
  brandOf: (slug) => (slug ?? "").trim(),
};

const PlatformBrandContext = createContext<PlatformBrandContextValue | null>(null);

/**
 * Makes the door → brand mapping available to every platform glyph and style
 * lookup in the social manager.
 *
 * A `SocialMediaPlatform` row is a *door*, not a brand: `instagramfb` is reached
 * through Facebook's dialog but produces an Instagram channel, which the model
 * records in `auth_destination`. Icon, colour and label lookups key off that
 * destination, so the `instagramfb` door and its channels render as Instagram
 * rather than falling through to an unbranded text badge — no icon is
 * registered under `instagramfb`, only under `instagram`.
 *
 * The rows are passed in rather than fetched here: the Server Component layout
 * already lists platforms for the section, and a provider that issued its own
 * request would be a client-side fetch of data the server already had.
 */
export function PlatformBrandProvider({
  platforms,
  children,
}: {
  platforms: readonly SocialMediaPlatform[] | undefined | null;
  children: ReactNode;
}) {
  const value = useMemo<PlatformBrandContextValue>(() => {
    const map = buildPlatformBrandMap(platforms);
    return { map, brandOf: (slug) => resolveBrandSlug(map, slug) };
  }, [platforms]);

  return (
    <PlatformBrandContext.Provider value={value}>
      {children}
    </PlatformBrandContext.Provider>
  );
}

/**
 * Read the door → brand resolver.
 *
 * Degrades to identity resolution when no provider is mounted, so a component
 * rendered outside the provider (a unit test, an isolated story) still shows the
 * right thing for ordinary platforms instead of throwing.
 */
export function usePlatformBrand(): PlatformBrandContextValue {
  return useContext(PlatformBrandContext) ?? EMPTY;
}
