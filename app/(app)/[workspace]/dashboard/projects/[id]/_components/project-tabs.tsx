"use client";

import Link from "next/link";

interface Props {
  projectNanoid: string;
  workspaceDomain: string;
  activeTab: string;
  taskCount: number;
}

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "tasks", label: "Tasks" },
] as const;

/**
 * The project record's tab strip.
 *
 * The active tab lives in the URL (`?tab=`), so a refresh keeps the same
 * view and a tab can be shared. The server component reads `searchParams`
 * and renders the matching tab; this component only builds the links.
 */
export function ProjectTabs({
  projectNanoid,
  workspaceDomain,
  activeTab,
  taskCount,
}: Props) {
  const counts: Record<string, number> = {
    tasks: taskCount,
  };

  return (
    <nav aria-label="Project sections" className="border-b">
      <ul className="-mb-px flex flex-wrap gap-1">
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          const count = counts[tab.key];
          return (
            <li key={tab.key}>
              <Link
                href={`/${workspaceDomain}/dashboard/projects/${projectNanoid}?tab=${tab.key}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
              >
                {tab.label}
                {typeof count === "number" ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
