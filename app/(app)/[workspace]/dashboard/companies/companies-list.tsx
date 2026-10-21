"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import { Settings2 } from "@/lib/icons";
import { type CompanyPageSize } from "@/lib/crm/constants";
import type {
  Company,
  CompanyStatusBreakdown,
  Country,
  Industry,
  ProspectStatus,
  TierClassification,
} from "@/lib/api";
import { CompaniesTable } from "@/app/(app)/[workspace]/dashboard/companies/companies-table";
import {
  CompaniesFilterBar,
  type CompanyFilters,
} from "./_components/companies-filter-bar";
import { CompaniesStatusBoard } from "./_components/companies-status-board";
import { CompaniesPagination } from "./_components/companies-pagination";
import { AddCompanyDialog } from "./_components/add-company-dialog";
import { AddTierDialog } from "./_components/add-tier-dialog";
import { ManageTiersDialog } from "./_components/manage-tiers-dialog";
import { CompaniesViewAllMenu } from "./_components/companies-view-all-menu";

export interface CompaniesPaginationState {
  page: number;
  pageSize: CompanyPageSize;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface Props {
  workspace: { nanoid: string; name: string; domain: string };
  companies: Company[];
  breakdown: CompanyStatusBreakdown;
  industries: Industry[];
  tierClassifications: TierClassification[];
  countries: Country[];
  /** Active filters, lifted from `searchParams`. */
  filters: CompanyFilters;
  /** Current `?ordering=` value from the URL (e.g. `name` / `-name`). */
  ordering?: string;
  /** Server-resolved pagination state. */
  pagination: CompaniesPaginationState;
}

/**
 * Interactive Companies list — filters, status board, table, and the
 * "Add Company" dialog. The Server Component page fetches the data; this
 * component owns the interactive slice:
 *
 *   - Search/filter row (writes to the URL via `router.push` so the
 *     server can re-render with new `searchParams`).
 *   - Status board cards (clicking one toggles `?status=...`).
 *   - Add Company dialog (posts to `createCompanyAction`).
 *   - Rows-per-page + pagination (URL-driven, like the filter row).
 */
export function CompaniesList({
  workspace,
  companies,
  breakdown,
  industries,
  tierClassifications,
  countries,
  filters,
  ordering,
  pagination,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [manageTiersOpen, setManageTiersOpen] = useState(false);

  /**
   * Push the merged filters to the URL.
   *
   * The URL is the single source of truth: a filter change re-renders the
   * Server Component, so the table, the status board and the pagination all
   * agree on what is being shown, and the view is shareable.
   */
  const pushFilters = useCallback(
    (
      next: Partial<CompanyFilters> & {
        ordering?: string | null;
        page?: number;
        pageSize?: CompanyPageSize;
      },
    ) => {
      const params = new URLSearchParams();
      const merged = { ...filters, ...next };
      if (merged.search) params.set("search", merged.search);
      if (merged.status) params.set("status", merged.status);
      if (merged.size) params.set("size", merged.size);
      if (merged.industry) params.set("industry", merged.industry);
      if (merged.tier) params.set("tier", merged.tier);
      if (merged.country) params.set("country", merged.country);
      if (merged.city) params.set("city", merged.city);
      if (merged.hasContacts === true) params.set("has_contacts", "true");
      if (merged.hasContacts === false) params.set("has_contacts", "false");
      if (merged.verified === true) params.set("verified", "true");
      if (merged.verified === false) params.set("verified", "false");

      const nextOrdering =
        "ordering" in next ? next.ordering : (ordering ?? undefined);
      if (nextOrdering) params.set("ordering", nextOrdering);

      // Filters and sorting reset to page 1; only the pagination control
      // changes the page without resetting.
      const filterChanged =
        "ordering" in next ||
        "search" in next ||
        "status" in next ||
        "size" in next ||
        "industry" in next ||
        "tier" in next ||
        "country" in next ||
        "city" in next ||
        "hasContacts" in next ||
        "verified" in next;
      const finalPage =
        "page" in next && next.page && !filterChanged ? next.page : 1;
      if (finalPage > 1) params.set("page", String(finalPage));

      const nextSize =
        "pageSize" in next && next.pageSize
          ? next.pageSize
          : pagination.pageSize;
      if (nextSize !== 25) params.set("page_size", String(nextSize));

      const qs = params.toString();
      startTransition(() => {
        router.push(
          `/${workspace.domain}/dashboard/companies${qs ? `?${qs}` : ""}`,
        );
      });
    },
    [filters, ordering, pagination.pageSize, router, workspace.domain],
  );

  const toggleStatus = (status: ProspectStatus) => {
    const selected = filters.status ? filters.status.split(",") : [];
    const next = selected.includes(status)
      ? selected.filter((s) => s !== status)
      : [...selected, status];
    pushFilters({ status: next.join(",") });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(`/${workspace.domain}/dashboard/companies`);
    });
  };

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.size ||
      filters.industry ||
      filters.tier ||
      filters.country ||
      filters.city ||
      filters.hasContacts !== null ||
      filters.verified !== null,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Prospecting</h1>
          <p className="text-sm text-muted-foreground">
            {breakdown.total} compan{breakdown.total !== 1 ? "ies" : "y"} in your
            pipeline
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CompaniesViewAllMenu workspaceDomain={workspace.domain} />
          <VSButton appearance="outline" onClick={() => setTierOpen(true)}>
            Add Tier
          </VSButton>
          <Button
            type="button"
            variant="outline"
            onClick={() => setManageTiersOpen(true)}
          >
            <Settings2 className="mr-1.5 size-4" aria-hidden="true" />
            Manage tiers
          </Button>
          <VSButton appearance="threeD" onClick={() => setAddOpen(true)}>
            Add Company
          </VSButton>
        </div>
      </div>

      <CompaniesFilterBar
        workspaceDomain={workspace.domain}
        filters={filters}
        industries={industries}
        tierClassifications={tierClassifications}
        countries={countries}
        ordering={ordering}
        pageSize={pagination.pageSize}
        onFilterChange={(next) => pushFilters(next)}
        onOrderingChange={(next) => pushFilters({ ordering: next })}
        onPageSizeChange={(size) => pushFilters({ pageSize: size })}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <CompaniesStatusBoard
        breakdown={breakdown}
        activeStatus={filters.status}
        onStatusToggle={toggleStatus}
      />

      <section aria-label="All companies" className="space-y-3">
        <h2 className="text-sm font-semibold">All Companies</h2>

        {companies.length === 0 ? (
          <Card className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
            {hasActiveFilters
              ? "No companies match your filters."
              : "No companies yet. Add one from the CRM."}
          </Card>
        ) : (
          <CompaniesTable
            companies={companies}
            tierClassifications={tierClassifications}
            workspaceDomain={workspace.domain}
            workspaceNanoid={workspace.nanoid}
            ordering={ordering}
            onOrderingChange={(next) => pushFilters({ ordering: next })}
          />
        )}

        <CompaniesPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          hasNext={pagination.hasNext}
          hasPrevious={pagination.hasPrevious}
          pending={pending}
          onPageChange={(page) => pushFilters({ page })}
        />
      </section>

      <AddCompanyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        workspace={workspace}
        industries={industries}
        tierClassifications={tierClassifications}
        countries={countries}
      />

      <AddTierDialog
        open={tierOpen}
        onOpenChange={setTierOpen}
        workspace={workspace}
      />

      <ManageTiersDialog
        open={manageTiersOpen}
        onOpenChange={setManageTiersOpen}
        workspaceDomain={workspace.domain}
        tiers={tierClassifications}
      />
    </div>
  );
}
