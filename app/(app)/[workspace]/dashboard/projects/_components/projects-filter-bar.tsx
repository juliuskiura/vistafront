"use client";

import { Search, X } from "@/lib/icons";
import {
  PROJECT_PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "@/lib/projects/constants";
import { Input } from "@/components/ui/input";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  resultCount: number;
  totalCount: number;
}

const selectClass =
  "h-10 rounded-lg border border-input bg-background px-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30";

/**
 * The list's filter bar.
 *
 * The backend does not filter projects — `ProjectViewSet.get_base_queryset`
 * returns `Project.objects.all()` — so the search and the two dropdowns
 * run in the browser over the full set the server sent.
 */
export function ProjectsFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  resultCount,
  totalCount,
}: Props) {
  const hasFilters = Boolean(search || status || priority);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative min-w-56 flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search projects…"
          aria-label="Search projects"
          className="pl-9"
        />
      </div>

      <label htmlFor="project-filter-status" className="sr-only">
        Filter by status
      </label>
      <select
        id="project-filter-status"
        value={status}
        onChange={(event) => onStatusChange(event.target.value)}
        className={selectClass}
      >
        <option value="">All statuses</option>
        {PROJECT_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <label htmlFor="project-filter-priority" className="sr-only">
        Filter by priority
      </label>
      <select
        id="project-filter-priority"
        value={priority}
        onChange={(event) => onPriorityChange(event.target.value)}
        className={selectClass}
      >
        <option value="">All priorities</option>
        {PROJECT_PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            onSearchChange("");
            onStatusChange("");
            onPriorityChange("");
          }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" aria-hidden="true" />
          Clear
        </button>
      ) : null}

      <p className="ml-auto text-xs text-muted-foreground">
        {resultCount === totalCount
          ? `${totalCount} project${totalCount === 1 ? "" : "s"}`
          : `${resultCount} of ${totalCount} projects`}
      </p>
    </div>
  );
}
