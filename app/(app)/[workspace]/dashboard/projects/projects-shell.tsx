"use client";

import { usePathname } from "next/navigation";
import { FolderKanban, Plus } from "lucide-react";
import Link from "next/link";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Projects", href: "", end: true, icon: FolderKanban },
];

interface ProjectsLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function ProjectsLayout({
  children,
  workspaceDomain,
}: ProjectsLayoutProps) {
  const pathname = usePathname();
  const basePath = `/${workspaceDomain}/dashboard/projects`;
  const isRoot = pathname === basePath;

  const trailing = (
    <Link
      href={`${basePath}/new`}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:from-primary-500 hover:to-secondary-500"
    >
      <Plus className="h-4 w-4" />
      New Project
    </Link>
  );

  return (
    <div className="flex min-h-full flex-col">
      {isRoot && (
        <Banner
          title="Client VA Engagements Portfolio"
          description="Internal virtual assistant operations managing client accounts, CRM outreach, Canva marketing, and daily workflows."
        />
      )}
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Projects"
        brandIcon={FolderKanban}
        items={NAV_ITEMS}
        hideBrand={!isRoot}
        trailing={trailing}
      />
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
