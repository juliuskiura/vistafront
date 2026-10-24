"use client";

import { ListTodo } from "lucide-react";
import {
  WorkspaceInnerNav,
  type InnerNavItem,
} from "@/components/workspace/workspace-inner-nav";
import { Banner } from "@/components/banner";

const NAV_ITEMS: InnerNavItem[] = [
  { label: "Tasks", href: "", end: true, icon: ListTodo },
];

interface TasksLayoutProps {
  children: React.ReactNode;
  workspaceDomain: string;
}

export function TasksLayout({
  children,
  workspaceDomain,
}: TasksLayoutProps) {
  const basePath = `/${workspaceDomain}/dashboard/projects/tasks`;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Tasks"
        description="Track and manage tasks across all projects."
      />
      <WorkspaceInnerNav
        basePath={basePath}
        brandLabel="Tasks"
        brandIcon={ListTodo}
        items={NAV_ITEMS}
        hideBrand
      />
      <div className="mt-6 flex-1">{children}</div>
    </div>
  );
}
