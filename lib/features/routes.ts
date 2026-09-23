/**
 * Route registry — the single place that ties a route to its subscription
 * feature and to its sidebar navigation identity.
 *
 * A route definition *declares* its feature (decision D4): the page itself
 * guards with `requireFeature(...)`, never by reverse-engineering a path.
 * This registry exists so:
 *   - the sidebar can derive each nav item's default href from `id` (WP6),
 *   - the access page knows which route a `feature=` param leads back to,
 *   - one place documents the route ↔ feature relationship.
 *
 * Paths are relative to `/{workspace}/…`. `path` is the canonical/landing
 * route for that feature segment (may be the module-level route or a
 * representative dynamic route).
 */

export interface FeatureRoute {
  /** Django nav item id the route belongs to. */
  id: string;
  /** Canonical path below the workspace segment (no `/{workspace}` prefix). */
  path: string;
  /** The subscription feature key that gates this route. */
  feature: string;
}

export const featureRoutes = {
  socialPosts: {
    id: "social_manager",
    path: "/dashboard/socialmanager",
    feature: "socialmanager.posts",
  },
  socialCalendar: {
    id: "social_manager",
    path: "/dashboard/socialmanager/calendar",
    feature: "socialmanager.scheduling",
  },
  socialAnalytics: {
    id: "social_manager",
    path: "/dashboard/socialmanager/analytics",
    feature: "socialmanager.analytics",
  },
  mediaAssets: {
    id: "media_library",
    path: "/dashboard/media",
    feature: "media_libary.assets",
  },
  mediaCollections: {
    id: "media_library",
    path: "/dashboard/media/collections",
    feature: "media_libary.collections",
  },
  notebookNotes: {
    id: "notebook",
    path: "/dashboard/notebook",
    feature: "notebook.notes",
  },
  projectProjects: {
    id: "projects",
    path: "/dashboard/projects",
    feature: "projectmanager.projects",
  },
  projectTasks: {
    id: "projects",
    path: "/dashboard/projects/tasks/[id]",
    feature: "projectmanager.tasks",
  },
  projectDeliverables: {
    id: "projects",
    path: "/dashboard/deliverables/[id]",
    feature: "projectmanager.deliverables",
  },
  members: {
    id: "members",
    path: "/dashboard/members",
    feature: "workspaces.membership",
  },
} as const satisfies Record<string, FeatureRoute>;

export const featureRouteList = Object.values(featureRoutes);

/** Every feature key the frontend knows about (for lookups/messaging). */
export const allFeatureKeys = featureRouteList
  .map((route) => route.feature)
  .filter((value, index, array) => array.indexOf(value) === index);

/**
 * The default landing path for a sidebar nav item id (WP6). Django emits
 * nav items by registry `id` only — it never sends URLs. This map turns
 * those ids back into Next.js routes.
 */
export const navLandingPaths: Partial<Record<string, string>> = {
  overview: "/dashboard",
  today: "/dashboard/today",
  schedule: "/dashboard/schedule",
  workspaces: "/dashboard/workspaces",
  members: "/dashboard/members",
  projects: "/dashboard/projects",
  media_library: "/dashboard/media",
  notebook: "/dashboard/notebook",
  socialmanager: "/dashboard/socialmanager",
  account: "/dashboard/account",
  billing: "/dashboard/billing",
  // Console-admin-only nav ids (only visible to platform admins).
  companies: "/dashboard/companies",
  contacts: "/dashboard/contacts",
  pipeline: "/dashboard/pipeline",
  deals: "/dashboard/deals",
  subscriptions: "/dashboard/subscriptions",
  platform: "/dashboard/platform",
};

export function navItemPath(id: string): string {
  return navLandingPaths[id] ?? "/dashboard";
}

export function featureById(id: string): FeatureRoute | undefined {
  return featureRouteList.find((route) => route.id === id);
}

export function featureByKey(feature: string): FeatureRoute | undefined {
  return featureRouteList.find((route) => route.feature === feature);
}

/** The default landing path after the access page (for the "Go back" link). */
export function accessPageGoBackPath(feature?: string): string {
  const route = feature ? featureByKey(feature) : undefined;
  return route?.id ? navItemPath(route.id) : "/dashboard";
}