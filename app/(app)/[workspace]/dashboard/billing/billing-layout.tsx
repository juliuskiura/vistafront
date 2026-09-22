"use client";

import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";
import { CreditCard, FileText, Wallet } from "@/lib/icons";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Plans", href: "", end: true, icon: CreditCard },
  { label: "Invoices", href: "/invoices", icon: FileText },
  { label: "Payment History", href: "/payments", icon: Wallet },
];

interface BillingLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function BillingLayout({
  children,
  workspaceDomain,
}: BillingLayoutProps) {
  const basePath = `/${workspaceDomain}/dashboard/billing`;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Billing"
        description="Manage how your organization pays, view invoices, and review payment history."
      />

      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Billing"
        brandIcon={CreditCard}
        items={NAV_ITEMS}
        hideBrand
      />

      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}