"use client";

import { usePathname } from "next/navigation";
import { User, Shield, Bell, KeyRound } from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Profile", href: "", end: true, icon: User },
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
        description="Manage your personal details, security preferences, and integrations."
      />

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Account"
        brandIcon={User}
        items={NAV_ITEMS}
      />

      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
