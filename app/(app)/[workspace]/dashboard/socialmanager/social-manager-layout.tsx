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
        <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome to Social Manager</h2>
            <p className="mt-1 text-sm text-primary-100">
              Plan, schedule, and publish across all your social channels from one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`${basePath}/compose`}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-primary-700 transition-all hover:bg-primary-50"
            >
              <PenLine className="size-4" /> New Post
            </Link>
            <Link
              href={`${basePath}/channels`}
              className="inline-flex items-center gap-2 rounded-md border border-primary-300 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-primary-900/90 hover:border-white hover:text-white"
            >
              <Plus className="size-4" /> Connect Account
            </Link>
          </div>
        </div>
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