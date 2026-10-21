"use client";

import Link from "next/link";

export interface CompanyTab {
  key: string;
  label: string;
  /** The number of records on this tab, when it is known. */
  count?: number;
}

interface Props {
  companyNanoid: string;
  workspaceDomain: string;
  activeTab: string;
  tabs: CompanyTab[];
  /** Keeps the current tab's other query params (e.g. `edit=1`). */
  extraQuery?: string;
}

/**
 * The record tab strip.
 *
 * The active tab lives in the URL (`?tab=`), so a refresh keeps the same
 * view and a tab can be shared. The server component reads `searchParams`
 * and renders the matching tab; this component only builds the links.
 */
export function RecordTabs({
  companyNanoid,
  workspaceDomain,
  activeTab,
  tabs,
  extraQuery,
}: Props) {
  return (
    <nav aria-label="Company sections" className="border-b">
      <ul className="-mb-px flex flex-wrap gap-1">
        {tabs.map((tab) => {
          const isActive = tab.key === activeTab;
          const query = extraQuery
            ? `?tab=${tab.key}&${extraQuery}`
            : `?tab=${tab.key}`;
          return (
            <li key={tab.key}>
              <Link
                href={`/${workspaceDomain}/dashboard/companies/${companyNanoid}${query}`}
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                }`}
              >
                {tab.label}
                {typeof tab.count === "number" ? (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    {tab.count}
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
