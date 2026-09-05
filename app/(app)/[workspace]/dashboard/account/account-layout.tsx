"use client";

import { usePathname } from "next/navigation";
import { User, Shield, Bell, KeyRound } from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";

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
      <div className="flex flex-col justify-between gap-4 bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Account Settings</h2>
          <p className="mt-1 max-w-xl text-sm text-primary-100">
            Manage your personal details, security preferences, and integrations.
          </p>
        </div>
      </div>

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