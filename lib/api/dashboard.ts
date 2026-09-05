import { serverFetch } from "./server-fetch";
import type { DashboardWidget, NavItem } from "./types";

/**
 * Server-rendered dashboard widgets for the current workspace.
 *
 * Backed by `/apis/dashboard/widgets/`. The `workspace` parameter
 * is forwarded as the `X-Workspace` header so the middleware
 * resolves the active tenant.
 */
export async function getDashboardWidgets(workspace: string): Promise<DashboardWidget[]> {
  return serverFetch<DashboardWidget[]>("/apis/dashboard/widgets/", { workspace });
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
