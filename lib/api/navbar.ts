import type { Paginated } from "./types";

export interface NavbarItem {
  id: number;
  title: string;
  url: string;
  sort_order: number;
  is_cta: boolean;
  has_children: boolean;
  children: NavbarItem[];
}

const NAVBAR_ORIGIN = "https://vistasolve.com";

/**
 * Server-rendered public navigation bar items.
 *
 * Backed by `https://vistasolve.com/apis/menu/navbar/` (the public site's
 * menu API, served from a different host than the app's BACKEND_URL, so it is
 * fetched directly rather than through serverFetch). Returns items ordered by
 * `sort_order`, with nested children for dropdowns. Fails gracefully (empty
 * array) so a public page never crashes when the menu service is unavailable.
 */
export async function getNavbar(): Promise<NavbarItem[]> {
  try {
    const response = await fetch(`${NAVBAR_ORIGIN}/apis/menu/navbar/`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as
      | NavbarItem[]
      | Paginated<NavbarItem>;
    if (Array.isArray(data)) return data;
    return data.results;
  } catch {
    return [];
  }
}
