"use client";

import {
  Users,
  MessageSquare,
  Settings,
  Phone,
} from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavGroup,
} from "@/components/workspace/workspace-inner-nav";

const NAV_GROUPS: InnerNavGroup[] = [
  {
    label: "Rooms",
    icon: MessageSquare,
    items: [{ label: "All Rooms", href: "", icon: MessageSquare, end: true }],
  },
  {
    label: "Agents",
    icon: Users,
    items: [{ label: "All Agents", href: "/agents", icon: Users, end: true }],
  },
  {
    label: "Settings",
    icon: Settings,
    items: [{ label: "Configuration", href: "/settings", icon: Settings }],
  },
];

interface LivechatLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function LivechatLayout({
  children,
  workspaceDomain,
}: LivechatLayoutProps) {
  const basePath = `/${workspaceDomain}/dashboard/livechat`;

  return (
    <div className="flex min-h-full flex-col">
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Live Chat"
        brandIcon={Phone}
        groups={NAV_GROUPS}
        trailing={
          <div className="hidden shrink-0 items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 dark:bg-slate-800 md:flex">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-600 dark:text-slate-400">
              Live
            </span>
          </div>
        }
      />
      <div className="flex-1 p-4 md:p-6">{children}</div>
    </div>
  );
}
