"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Share2,
  CalendarDays,
  PenLine,
  ListOrdered,
  Upload,
  BarChart3,
  Plus,
  Send,
} from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
  type InnerNavGroup,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

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
  { label: "Channels", href: "/channels", icon: Share2 },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
];

const NAV_GROUPS: InnerNavGroup[] = [
  {
    label: "Publishing",
    icon: Send,
    items: [
      { label: "Queues", href: "/queues", icon: ListOrdered },
      { label: "Bulk Upload", href: "/bulk-upload", icon: Upload },
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
    ],
  },
];

interface SocialManagerLayoutProps {
  children: React.ReactNode;
  /** Active workspace domain, injected by the parent Server Component. */
  workspaceDomain: string;
}

export function SocialManagerLayout({
  children,
  workspaceDomain,
}: SocialManagerLayoutProps) {
  const pathname = usePathname();

  const basePath = `/${workspaceDomain}/dashboard/socialmanager`;

  const isHome = pathname === basePath;

  return (
    <div className="flex flex-col">
      {isHome && (
        <Banner
          title="Welcome to Social Manager"
          description="Plan, schedule, and publish across all your social channels from one place."
          actions={[
            { label: "New Post", icon: PenLine, href: `${basePath}/compose` },
            { label: "Connect Account", icon: Plus, href: `${basePath}/channels`, variant: "secondary" },
          ]}
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
