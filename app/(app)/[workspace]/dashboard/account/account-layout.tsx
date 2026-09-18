"use client";

import { usePathname } from "next/navigation";
import { Building2, Shield, Bell, KeyRound, UserRound } from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "User Account", href: "", end: true, icon: UserRound },
  { label: "Organization", href: "/organization", icon: Building2 },
  { label: "Security", href: "/security", icon: Shield },
];

interface AccountLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function AccountLayout({
  children,
  workspaceDomain,
}: AccountLayoutProps) {
  const pathname = usePathname();

  const basePath = `/${workspaceDomain}/dashboard/account`;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Account Settings"
        description="Manage your organization details, security preferences, and integrations."
      />

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Account"
        brandIcon={UserRound}
        items={NAV_ITEMS}
        hideBrand
      />

      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
