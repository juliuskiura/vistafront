"use client";

import { usePathname } from "next/navigation";
import { FolderKanban, Plus } from "@/lib/icons";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [];

interface ProjectsLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

const ROUTE_META: Record<
  string,
  { title: string; description: string }
> = {
  "": {
    title: "Business Operations Engagements Portfolio",
    description:
      "Internal operations managing client accounts, CRM outreach, Canva marketing, and daily workflows.",
  },
  "/new": {
    title: "New project",
    description:
      "Name the project, set its status and priority, and add dates and a description to keep everyone aligned.",
  },
  "/categories": {
    title: "Category taxonomy",
    description: "Classify projects with workspace-defined categories.",
  },
};

export function ProjectsLayout({
  children,
  workspaceDomain,
}: ProjectsLayoutProps) {
  const pathname = usePathname();
  const basePath = `/${workspaceDomain}/dashboard/projects`;
  const isRoot = pathname === basePath;

  const suffix = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length) || ""
    : "";
  const meta = ROUTE_META[suffix] ?? {
    title: "Projects",
    description: "",
  };

  const showBanner =
    suffix === "" || suffix === "/new" || suffix === "/categories";
  const showOuterNav = showBanner;

  const actions = isRoot
    ? [
        {
          label: "New Project",
          icon: Plus,
          href: `${basePath}/new`,
        },
      ]
    : undefined;

  return (
    <div className="flex min-h-full flex-col">
      {showBanner ? (
        <Banner title={meta.title} description={meta.description} actions={actions} />
      ) : null}
      {showOuterNav ? (
        <WorkspaceInnerNav
          basePath={basePath}
          brandLabel="Projects"
          brandIcon={FolderKanban}
          items={NAV_ITEMS}
          hideBrand={false}
        />
      ) : null}
      {showOuterNav ? (
        <div className="mt-6 flex-1">{children}</div>
      ) : (
        <div className="flex-1">{children}</div>
      )}
    </div>
  );
}
