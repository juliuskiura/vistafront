"use client";

import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Building2, Flag, Handshake, Users } from "@/lib/icons";

/**
 * The four CRM sections, in the order the backend registers them in the
 * sidebar (`regwakes/crm/navigation.py`). The icons match the sidebar
 * entries, so the strip and the sidebar read the same.
 */
const NAV_ITEMS: InnerNavItem[] = [
  { label: "Companies", href: "/companies", icon: Building2 },
  { label: "Contacts", href: "/contacts", icon: Users },
  { label: "Pipeline", href: "/pipeline", icon: Flag },
  { label: "Deals", href: "/deals", icon: Handshake },
];

interface CrmInnerNavProps {
  /** The workspace slug — the dashboard segment every CRM route lives under. */
  workspaceDomain: string;
  /**
   * A page-level action, rendered at the end of the strip.
   *
   * The company record puts its actions menu here, so the record actions sit
   * right after the "Deals" pill instead of in a row of their own.
   */
  trailing?: React.ReactNode;
}

/**
 * The CRM's inner nav — the little strip of pill buttons under the banner.
 *
 * Every other app in the workspace shell has one (Media Library, Billing,
 * Subscriptions, Livechat), so the CRM pages carry it too: it is what lets
 * the user move between the four CRM sections without going back to the
 * sidebar.
 *
 * The base path is the dashboard root rather than `/companies`, because the
 * CRM sections are siblings under it. The brand is hidden for the same
 * reason billing hides it — the pills already say which app this is, and a
 * brand link would only take the user out of the CRM.
 */
export function CrmInnerNav({ workspaceDomain, trailing }: CrmInnerNavProps) {
  return (
    <WorkspaceInnerNav
      basePath={`/${workspaceDomain}/dashboard`}
      brandLabel="CRM"
      brandIcon={Building2}
      items={NAV_ITEMS}
      trailing={trailing}
      hideBrand
    />
  );
}
