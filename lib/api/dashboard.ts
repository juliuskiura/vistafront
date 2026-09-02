import "server-only";

import { serverFetch } from "./server-fetch";
import type { DashboardWidget, NavItem } from "./types";

/**
 * Server-rendered dashboard widgets for the current workspace.
 *
 * Backed by `/apis/dashboard/widgets/`. The backend resolves the active
 * workspace from the session (cookie + path), so this works inside a
 * `[workspace]` Server Component without extra arguments.
 */
export async function getDashboardWidgets(): Promise<DashboardWidget[]> {
  return serverFetch<DashboardWidget[]>("/apis/dashboard/widgets/");
}

/**
 * Server-rendered navigation tree for the current workspace.
 *
 * Backed by `/apis/navigation/sidebar/`. The tree already includes the
 * correct `to` paths for the active workspace.
 */
export async function getNavigationSidebar(): Promise<NavItem[]> {
  return serverFetch<NavItem[]>("/apis/navigation/sidebar/");
}
