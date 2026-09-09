"use client";

import { usePathname } from "next/navigation";
import { Building2, Shield, Bell, KeyRound } from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Organization", href: "", end: true, icon: Building2 },
  { label: "Security", href: "/security", icon: Shield },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "API Keys", href: "/api-keys", icon: KeyRound },
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
    <div className="flex flex-col">
      <Banner
        title="Account Settings"
        description="Manage your organization details, security preferences, and integrations."
      />

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Account"
        brandIcon={Building2}
        items={NAV_ITEMS}
      />

      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
