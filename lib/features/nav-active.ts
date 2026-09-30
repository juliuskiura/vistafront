import type { NavItem } from "@/lib/api";
import { navItemPath } from "@/lib/features/routes";

/**
 * Single source of truth for "which sidebar item is the user on right now".
 *
 * The sidebar highlight (`is-active` class) and the header page title are two
 * separate visual outputs of the same question. They used to be two
 * hand-rolled copies of the same predicate inside one file, which is how they
 * drifted into disagreeing with each other. Both now call in here.
 */

/**
 * The pathname with the leading workspace segment removed, e.g.
 * `/acme/dashboard/projects` -> `/dashboard/projects`. Sidebar links are
 * always workspace-relative (see `navLandingPaths`), so matching happens in
 * that space. The workspace root collapses to `/`.
 */
export function workspaceRelativePath(pathname: string): string {
  return pathname.replace(/^\/[^/]+/, "") || "/";
}

/**
 * True when `item` owns `pathname`.
 *
 * Ids with no registered route (unported features such as the
 * console-admin-only `documents` and `developer`) are NEVER active. They have
 * no path to match against, so treating them as a match against any default is
 * what caused several links to highlight at once.
 */
export function isNavItemActive(
  pathname: string,
  item: Pick<NavItem, "id" | "end">,
): boolean {
  const target = navItemPath(item.id);
  if (target === undefined) return false;

  const trimmed = workspaceRelativePath(pathname);
  if (trimmed === target) return true;
  // Tolerate a trailing slash on the registry path ("/dashboard/" vs
  // "/dashboard") so the root item still matches on the workspace index.
  if (trimmed === target.replace(/\/$/, "")) return true;
  // `end: true` (Overview only) matches the section root exclusively and must
  // not claim nested routes.
  if (item.end === true) return false;
  return trimmed.startsWith(`${target}/`);
}

/**
 * The nav item that owns `pathname`, or `undefined` when nothing matches.
 *
 * Longest matching path wins, so a future parent/child pair in the registry
 * can never make two items claim the same URL.
 */
export function findActiveNavItem(
  pathname: string,
  nav: readonly NavItem[],
): NavItem | undefined {
  let best: NavItem | undefined;
  let bestLength = -1;

  for (const item of nav) {
    if (!isNavItemActive(pathname, item)) continue;
    const length = navItemPath(item.id)?.length ?? 0;
    if (length > bestLength) {
      best = item;
      bestLength = length;
    }
  }

  return best;
}
