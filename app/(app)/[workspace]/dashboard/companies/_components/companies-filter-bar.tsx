"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "@/lib/icons";
import {
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  type CompanyPageSize,
} from "@/lib/crm/constants";
import type {
  Country,
  Industry,
  TierClassification,
} from "@/lib/api";
import { CompaniesStatusFilter } from "./companies-status-filter";

/** Which archived companies the list shows. */
export type CompanyArchiveFilter = "" | "all" | "true";

/** The filters the list understands, lifted from `searchParams`. */
export interface CompanyFilters {
  search: string;
  /** A comma-separated list of statuses, or a single one. */
  status: string;
  size: string;
  industry: string;
  tier: string;
  country: string;
  city: string;
  hasContacts: boolean | null;
  verified: boolean | null;
  /** `""` = active only, `"all"` = active + archived, `"true"` = archived only. */
  archived: CompanyArchiveFilter;
}

export interface CompanyFilterBarProps {
  workspaceDomain: string;
  filters: CompanyFilters;
  industries: Industry[];
  tierClassifications: TierClassification[];
  countries: Country[];
  /** The current `?ordering=` value. */
  ordering?: string;
  pageSize: CompanyPageSize;
  onFilterChange: (next: Partial<CompanyFilters>) => void;
  onOrderingChange: (ordering: string | undefined) => void;
  onPageSizeChange: (size: CompanyPageSize) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

const SEARCH_DEBOUNCE_MS = 300;

export function CompaniesFilterBar({
  workspaceDomain,
  filters,
  industries,
  tierClassifications,
  countries,
  ordering,
  pageSize,
  onFilterChange,
  onOrderingChange,
  onPageSizeChange,
  onClear,
  hasActiveFilters,
}: CompanyFilterBarProps) {
  const [searchDraft, setSearchDraft] = useState(filters.search);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounce the search so typing does not fire a request per keystroke,
  // but still pushes to the URL (the URL stays the source of truth).
  useEffect(() => {
    if (searchDraft === filters.search) return;
    const handle = setTimeout(() => {
      onFilterChange({ search: searchDraft });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [searchDraft, filters.search, onFilterChange]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search companies…"
            className="pl-9 pr-9"
            aria-label="Search companies"
          />
          {searchDraft ? (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                onFilterChange({ search: "" });
              }}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <SelectField
          label="Filter by size"
          value={filters.size}
          onChange={(v) => onFilterChange({ size: v })}
          options={[
            { value: "", label: "All sizes" },
            ...COMPANY_SIZES.map((s) => ({
              value: s,
              label: COMPANY_SIZE_LABELS[s],
            })),
          ]}
        />

        <SelectField
          label="Filter by industry"
          value={filters.industry}
          onChange={(v) => onFilterChange({ industry: v })}
          options={[
            { value: "", label: "All industries" },
            ...industries.map((i) => ({ value: i.name, label: i.name })),
          ]}
        />

        <SelectField
          label="Filter by country"
          value={filters.country}
          onChange={(v) => onFilterChange({ country: v })}
          options={[
            { value: "", label: "All countries" },
            ...countries.map((c) => ({ value: c.code, label: c.name })),
          ]}
        />

        <Input
          aria-label="Filter by city"
          placeholder="City…"
          value={filters.city}
          onChange={(e) => onFilterChange({ city: e.target.value })}
          className="h-9 w-40"
        />

        <SelectField
          label="Filter by contacts"
          value={
            filters.hasContacts === null ? "" : String(filters.hasContacts)
          }
          onChange={(v) =>
            onFilterChange({
              hasContacts: v === "" ? null : v === "true",
            })
          }
          options={[
            { value: "", label: "Any contacts" },
            { value: "true", label: "Has contacts" },
            { value: "false", label: "No contacts" },
          ]}
        />

        <SelectField
          label="Filter by verification"
          value={filters.verified === null ? "" : String(filters.verified)}
          onChange={(v) =>
            onFilterChange({
              verified: v === "" ? null : v === "true",
            })
          }
          options={[
            { value: "", label: "Any verification" },
            { value: "true", label: "Verified" },
            { value: "false", label: "Unverified" },
          ]}
        />

        <SelectField
          label="Filter by tier"
          value={filters.tier}
          onChange={(v) => onFilterChange({ tier: v })}
          options={[
            { value: "", label: "All tiers" },
            ...tierClassifications.map((t) => ({
              value: t.nanoid,
              label: `${t.label} — ${t.title}`,
            })),
          ]}
        />

        <SelectField
          label="Filter by archive"
          value={filters.archived}
          onChange={(v) =>
            onFilterChange({ archived: v as CompanyArchiveFilter })
          }
          options={[
            { value: "", label: "Active only" },
            { value: "all", label: "Include archived" },
            { value: "true", label: "Archived only" },
          ]}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <CompaniesStatusFilter
          status={filters.status}
          onStatusChange={(status) => onFilterChange({ status })}
        />

        <SelectField
          label="Sort by"
          value={ordering ?? ""}
          onChange={(v) => onOrderingChange(v || undefined)}
          options={[
            { value: "", label: "Default order" },
            { value: "name", label: "Name (A–Z)" },
            { value: "-name", label: "Name (Z–A)" },
            { value: "status", label: "Status" },
            { value: "-created_at", label: "Newest first" },
            { value: "created_at", label: "Oldest first" },
            { value: "contact_count", label: "Most contacts" },
            { value: "total_listings", label: "Most listings" },
          ]}
        />

        <SelectField
          label="Rows per page"
          value={String(pageSize)}
          onChange={(v) => onPageSizeChange(Number(v) as CompanyPageSize)}
          options={[25, 50, 75, 100].map((n) => ({
            value: String(n),
            label: `${n} rows`,
          }))}
        />

        {hasActiveFilters ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClear}
          >
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-lg border border-input bg-background px-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      {options.map((o) => (
        <option key={`${o.value}::${o.label}`} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
