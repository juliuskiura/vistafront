"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  KeyRound,
  LayoutDashboard,
  Shield,
  ShieldPlus,
} from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Overview", href: "", end: true, icon: LayoutDashboard },
  { label: "Roles", href: "/roles", icon: Shield },
  { label: "Permissions", href: "/permissions", icon: KeyRound },
];

interface WorkspacesShellLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function WorkspacesShellLayout({
  children,
  workspaceDomain,
}: WorkspacesShellLayoutProps) {
  const pathname = usePathname();

  const basePath = `/${workspaceDomain}/dashboard/workspaces`;

  const isHome = pathname === basePath;

  return (
    <div className="flex min-h-full flex-col">
      {isHome && (
        <Banner
          title="Workspaces & Permissions"
          description="Manage your team, define custom roles, and decide exactly which parts of this workspace each role can access."
          actions={[
            { label: "Create Role", icon: ShieldPlus, href: `${basePath}/roles` },
            {
              label: "New Permission",
              icon: KeyRound,
              href: `${basePath}/permissions`,
              variant: "secondary",
            },
          ]}
        >
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#4d7fff]/60 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-72 w-72 rounded-full bg-[#7a5cff]/40 blur-3xl" />
          <div className="absolute -bottom-20 left-1/4 h-72 w-72 rounded-full bg-[#00e5ff]/40 blur-3xl" />
          <div className="absolute -right-8 -bottom-8 h-56 w-56 rounded-full bg-[#19e664]/30 blur-3xl" />
        </Banner>
      )}

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Workspaces"
        brandIcon={Building2}
        items={NAV_ITEMS}
        trailing={
          <Link
            href={`${basePath}/roles`}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-2.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:from-primary-500 hover:to-secondary-500 md:px-3"
          >
            <ShieldPlus className="h-4 w-4" />
            New Role
          </Link>
        }
      />

      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}