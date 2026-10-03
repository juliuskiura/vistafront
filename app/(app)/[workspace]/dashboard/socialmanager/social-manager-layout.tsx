"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  PenLine,
  Share2,
  Zap,
} from "@/lib/icons";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
  type InnerNavGroup,
} from "@/components/workspace/workspace-inner-nav";
import { Banner, type BannerAction } from "@/components/banner";
import { ConnectAccountButton } from "@/components/socialmanager/connect-account-button";
import { useConnectAccount } from "@/lib/context";
import type { SocialMediaPlatform } from "@/lib/api/types";
import { QUICK_ACTIONS } from "./quick-actions";

/* ──────────────────────────────────────────────────────────────────────
 * Social Manager Layout
 *
 * Wraps every /socialmanager/* route with:
 *  • A sticky horizontal inner-nav (desktop pills → mobile dropdown)
 *  • Rendered through the shared WorkspaceInnerNav shell.
 *
 * The `<slot>` renders the active child page.
 * ────────────────────────────────────────────────────────────────────── */

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Overview", href: "", end: true, icon: LayoutDashboard },
  { label: "Unified Inbox", href: "/inbox", icon: MessageSquare },
  { label: "Channels", href: "/channels", icon: Share2 },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
];

// One shortcut menu, not a set of sub-sections: every destination the team
// reaches for from the header lives here, each with its own tinted icon, so
// the trigger is an action rather than another place to navigate from.
const NAV_GROUPS: InnerNavGroup[] = [
  { label: "Quick Actions", icon: Zap, accent: true, items: QUICK_ACTIONS },
];

interface SocialManagerLayoutProps {
  children: React.ReactNode;
  /** Active workspace domain, injected by the parent Server Component. */
  workspaceDomain: string;
  /**
   * Platform catalogue for the workspace, listed server-side by the parent
   * layout. The "Connect Account" card draws a disc per connectable network
   * from it, so the card ships complete with the page instead of asking for
   * the list once it mounts.
   */
  platforms: SocialMediaPlatform[];
}

export function SocialManagerLayout({
  children,
  workspaceDomain,
  platforms,
}: SocialManagerLayoutProps) {
  const pathname = usePathname();
  const { canConnect } = useConnectAccount();

  const basePath = `/${workspaceDomain}/dashboard/socialmanager`;

  const isHome = pathname === basePath;

  const actions: BannerAction[] = [
    { label: "New Post", icon: PenLine, href: `${basePath}/compose` },
  ];

  // Opens the shared ConnectAccountModal (one instance, mounted by
  // ConnectAccountProvider) instead of navigating to /channels and making the
  // user start the OAuth flow from a second screen.
  if (canConnect) {
    actions.push({
      label: "Connect Account",
      node: <ConnectAccountButton platforms={platforms} />,
    });
  }

  return (
    <div className="flex flex-col">
      {isHome && (
        <Banner
          title="Welcome to Social Manager"
          description="Plan, schedule, and publish across all your social channels from one place."
          actions={actions}
        />
      )}

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Social Manager"
        brandIcon={Share2}
        items={NAV_ITEMS}
        groups={NAV_GROUPS}
        trailing={
          <Link
            href={`${basePath}/compose`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:from-primary-500 hover:to-secondary-500 md:px-3"
          >
            <PenLine className="h-4 w-4" />
            New Post
          </Link>
        }
      />

      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}
