"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/context";
import { cn } from "@/lib/utils";
import {
  BOARD_STATUSES,
  COMPANY_PAGE_SIZES,
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  PROSPECT_LABELS,
  STATUS_COLORS,
  type CompanyPageSize,
} from "@/lib/crm/constants";
import type {
  Company,
  CompanyStatusBreakdown,
  Industry,
  ProspectStatus,
  TierClassification,
} from "@/lib/api";
import { CompaniesTable } from "@/app/(app)/[workspace]/dashboard/companies/companies-table";
import {
  createCompanyAction,
  initialCreateCompanyState,
  type CreateCompanyActionState,
  createTierClassificationAction,
  initialCreateTierClassificationState,
  type CreateTierClassificationActionState,
} from "@/app/(app)/[workspace]/dashboard/companies/actions";

export interface CompaniesPagination {
  page: number;
  pageSize: CompanyPageSize;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface Props {
  workspace: {
    nanoid: string;
    name: string;
    domain: string;
  };
  companies: Company[];
  breakdown: CompanyStatusBreakdown;
  industries: Industry[];
  tierClassifications: TierClassification[];
  /** Active filters, lifted from `searchParams`. */
  filters: {
    search: string;
    status: ProspectStatus | null;
    size: string;
    industry: string;
    tier: string;
    hasContacts: boolean | null;
    verified: boolean | null;
  };
  /** Current `?ordering=` value from the URL (e.g. `name` / `-name`). */
  ordering?: string;
  /** Server-resolved pagination state. */
  pagination: CompaniesPagination;
}

function VSButton({
  className,
  appearance = "solid",
  ...props
}: React.ComponentProps<"button"> & {
  appearance?: "solid" | "ghost" | "outline" | "threeD";
}) {
  return (
    <Button
      className={cn(
        "h-11 rounded-xl px-4 font-medium",
        appearance === "threeD" &&
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--primary-700)] transition-all hover:translate-y-[1px] hover:shadow-[0_3px_0_0_var(--primary-700)] active:translate-y-[4px] active:shadow-none",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Interactive Companies list — filters, status board, table, and the
 * "Add Company" dialog. The Server Component page fetches the data; this
 * component owns the interactive slice:
 *
 *   - Search/filter chip row (writes to the URL via `router.push` so the
 *     server can re-render with new `searchParams`).
 *   - Status board cards (clicking one toggles `?status=...`).
 *   - Add Company dialog (posts to `createCompanyAction`).
 *   - Add Tier dialog (posts to `createTierClassificationAction`).
 *   - Rows-per-page + pagination (URL-driven, like the filter row).
 */
export function CompaniesList({
  workspace,
  companies,
  breakdown,
  industries,
  tierClassifications,
  filters,
  ordering,
  pagination,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [addOpen, setAddOpen] = useState(false);
  const [tierOpen, setTierOpen] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.search);

  const [newTierTitle, setNewTierTitle] = useState("");
  const [newTierLabel, setNewTierLabel] = useState("");
  const [newTierDescription, setNewTierDescription] = useState("");

  const [tierState, tierFormAction, tierPending] = useActionState<
    CreateTierClassificationActionState,
    FormData
  >(createTierClassificationAction, initialCreateTierClassificationState);

  useEffect(() => {
    setSearchDraft(filters.search);
  }, [filters.search]);

  const pushFilters = (
    next: Partial<Props["filters"]> & {
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
    if (merged.hasContacts === true) params.set("has_contacts", "true");
    if (merged.hasContacts === false) params.set("has_contacts", "false");
    if (merged.verified === true) params.set("verified", "true");
    if (merged.verified === false) params.set("verified", "false");
    if ("ordering" in next) {
      if (next.ordering) params.set("ordering", next.ordering);
    } else if (ordering) {
      params.set("ordering", ordering);
    }
    // Filters + sorting reset to page 1; only pagination controls can change
    // the page without resetting.
    const nextPage =
      "page" in next && next.page ? next.page : "page" in next ? 1 : 1;
    const nextSize =
      "pageSize" in next && next.pageSize ? next.pageSize : pagination.pageSize;
    const filterChanged =
      "ordering" in next ||
      "search" in next ||
      "status" in next ||
      "size" in next ||
      "industry" in next ||
      "tier" in next ||
      "hasContacts" in next ||
      "verified" in next;
    const finalPage = filterChanged ? 1 : nextPage;
    if (finalPage > 1) params.set("page", String(finalPage));
    if (nextSize !== 25) params.set("page_size", String(nextSize));
    const qs = params.toString();
    startTransition(() => {
      router.push(`/${workspace.domain}/dashboard/companies${qs ? `?${qs}` : ""}`);
    });
  };

  const toggleStatus = (s: ProspectStatus) => {
    pushFilters({ status: filters.status === s ? null : s });
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
      filters.hasContacts !== null ||
      filters.verified !== null,
  );

  const totalCount = breakdown.total;

  const pageButtons = pagination.totalPages > 1
    ? Array.from({ length: pagination.totalPages }, (_, i) => i + 1).filter(
        (p) =>
          p === 1 ||
          p === pagination.totalPages ||
          Math.abs(p - pagination.page) <= 2,
      )
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Prospecting</h1>
          <p className="text-sm text-muted-foreground">
            {totalCount} compan{totalCount !== 1 ? "ies" : "y"} in your pipeline
          </p>
        </div>
        <VSButton appearance="threeD" onClick={() => setAddOpen(true)}>
          Add Company
        </VSButton>
      </div>

      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          pushFilters({ search: searchDraft });
        }}
        role="search"
      >
        <div className="relative max-w-md">
          <Input
            type="search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search companies…"
            className="pr-9"
            aria-label="Search companies"
          />
          {searchDraft ? (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("");
                pushFilters({ search: "" });
              }}
              aria-label="Clear search"
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          ) : null}
        </div>
        <SelectField
          label="Filter by status"
          value={filters.status ?? ""}
          onChange={(v) => pushFilters({ status: (v as ProspectStatus) || null })}
          options={[
            { value: "", label: "All statuses" },
            ...BOARD_STATUSES.map((s) => ({
              value: s,
              label: PROSPECT_LABELS[s],
            })),
          ]}
        />
        <SelectField
          label="Filter by size"
          value={filters.size}
          onChange={(v) => pushFilters({ size: v })}
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
          onChange={(v) => pushFilters({ industry: v })}
          options={[
            { value: "", label: "All industries" },
            ...industries.map((i) => ({ value: i.name, label: i.name })),
          ]}
        />
        <SelectField
          label="Filter by contacts"
          value={
            filters.hasContacts === null ? "" : String(filters.hasContacts)
          }
          onChange={(v) =>
            pushFilters({
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
            pushFilters({
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
          onChange={(v) => pushFilters({ tier: v })}
          options={[
            { value: "", label: "All tiers" },
            ...tierClassifications.map((t) => ({
              value: t.nanoid,
              label: `${t.label} — ${t.title}`,
            })),
          ]}
        />
        {hasActiveFilters ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={clearFilters}
            disabled={pending}
          >
            Clear filters
          </Button>
        ) : null}
        <VSButton
          appearance="outline"
          onClick={() => setTierOpen(true)}
        >
          Add Tier
        </VSButton>
      </form>

      <section aria-label="Status breakdown" className="space-y-2">
        <h2 className="sr-only">Companies by status</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {BOARD_STATUSES.map((s) => {
            const count = breakdown.counts[s] ?? 0;
            const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
            const isActive = filters.status === s;
            return (
              <Card
                key={s}
                role="button"
                tabIndex={0}
                aria-pressed={isActive}
                onClick={() => toggleStatus(s)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggleStatus(s);
                  }
                }}
                className={`cursor-pointer transition-colors ${
                  isActive
                    ? "border-primary bg-primary/10 ring-2 ring-primary/40"
                    : "hover:bg-muted/40"
                }`}
              >
                <CardHeader>
                  <CardTitle className="capitalize">{PROSPECT_LABELS[s]}</CardTitle>
                  <CardAction>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_COLORS[s]}`}
                    >
                      {pct}%
                    </span>
                  </CardAction>
                </CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold">{count}</span>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {count === 1 ? "company" : "companies"}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-label="All companies" className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">All Companies</h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <label htmlFor="companies-page-size">Rows per page</label>
            <select
              id="companies-page-size"
              value={pagination.pageSize}
              onChange={(e) =>
                pushFilters({
                  pageSize: Number(e.target.value) as CompanyPageSize,
                  page: 1,
                })
              }
              disabled={pending}
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              aria-label="Rows per page"
            >
              {COMPANY_PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>

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

        {pagination.totalCount > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
              {pagination.totalCount > 0 ? ` · ${pagination.totalCount} total` : ""}
            </p>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasPrevious || pending}
                onClick={() =>
                  pushFilters({ page: Math.max(1, pagination.page - 1) })
                }
              >
                Previous
              </Button>
              {pageButtons.map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                const isCurrent = p === pagination.page;
                return (
                  <span key={p} className="flex items-center">
                    {showEllipsis ? (
                      <span className="px-2 text-sm text-muted-foreground">
                        …
                      </span>
                    ) : null}
                    <Button
                      size="sm"
                      variant={isCurrent ? "default" : "ghost"}
                      disabled={pending}
                      onClick={() => pushFilters({ page: p })}
                      aria-current={isCurrent ? "page" : undefined}
                    >
                      {p}
                    </Button>
                  </span>
                );
              })}
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination.hasNext || pending}
                onClick={() =>
                  pushFilters({
                    page: Math.min(pagination.totalPages, pagination.page + 1),
                  })
                }
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>

      <AddCompanyDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        workspace={workspace}
        industries={industries}
        tierClassifications={tierClassifications}
      />

      <AddTierDialog
        open={tierOpen}
        onOpenChange={setTierOpen}
        workspace={workspace}
        tierState={tierState}
        tierFormAction={tierFormAction}
        tierPending={tierPending}
        newTierTitle={newTierTitle}
        setNewTierTitle={setNewTierTitle}
        newTierLabel={newTierLabel}
        setNewTierLabel={setNewTierLabel}
        newTierDescription={newTierDescription}
        setNewTierDescription={setNewTierDescription}
      />
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

/* ──────────────────────────────────────────────────────────────────────
 * Add Company dialog
 * ────────────────────────────────────────────────────────────────────── */

function AddCompanyDialog({
  open,
  onOpenChange,
  workspace,
  industries,
  tierClassifications,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string; domain: string };
  industries: Industry[];
  tierClassifications: TierClassification[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [state, formAction, pending] = useActionState<
    CreateCompanyActionState,
    FormData
  >(createCompanyAction, initialCreateCompanyState);
  const [phoneEntries, setPhoneEntries] = useState<string[]>([""]);
  const [socialEntries, setSocialEntries] = useState<
    { url: string; name: string }[]
  >([{ url: "", name: "" }]);

  useEffect(() => {
    if (state.status === "success") {
      toast.push({
        variant: "success",
        message: state.message ?? "Company created.",
      });
      onOpenChange(false);
      setPhoneEntries([""]);
      setSocialEntries([{ url: "", name: "" }]);
      router.refresh();
    } else if (state.status === "error" && !state.fieldErrors) {
      toast.push({
        variant: "error",
        message: state.message ?? "Could not create company.",
      });
    }
  }, [state, toast, onOpenChange, router]);

  const errors = state.fieldErrors ?? {};
  const formError =
    state.status === "error" && Object.keys(errors).length === 0
      ? state.message
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] gap-0 overflow-hidden p-0 sm:max-w-lg"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader className="bg-primary px-5 py-4 text-primary-foreground">
          <DialogTitle className="text-primary-foreground">
            <Building2 className="mr-2 inline-block size-4" />
            New Company
          </DialogTitle>
          <DialogDescription className="text-primary-foreground/80">
            Add a company to {workspace.name}'s CRM.
          </DialogDescription>
        </DialogHeader>

        <form
          action={(submitted) => {
            submitted.set("workspace_domain", workspace.domain);
            phoneEntries.forEach((p, i) => {
              if (p.trim()) submitted.set(`__phone_${i}`, p.trim());
            });
            submitted.delete("phone_numbers");
            const cleanPhones = phoneEntries.map((p) => p.trim()).filter(Boolean);
            cleanPhones.forEach((p) => submitted.append("phone_numbers", p));
            const cleanSocials = socialEntries
              .map((s) => ({ url: s.url.trim(), name: s.name.trim() || undefined }))
              .filter((s) => s.url);
            submitted.delete("social_links");
            cleanSocials.forEach((s) =>
              submitted.append("social_links", JSON.stringify(s)),
            );
            formAction(submitted);
          }}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4"
        >
          <input type="hidden" name="workspace_domain" value={workspace.domain} />

          <div className="space-y-1.5">
            <Label htmlFor="company-name">Name *</Label>
            <Input
              id="company-name"
              name="name"
              required
              aria-invalid={!!errors.name}
            />
            {errors.name?.[0] ? (
              <p className="text-xs text-destructive">{errors.name[0]}</p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-domain">Domain</Label>
              <Input id="company-domain" name="domain" placeholder="example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-email">Email</Label>
              <Input id="company-email" name="email" type="email" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-industry">Industry</Label>
              <select
                id="company-industry"
                name="industry"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                defaultValue=""
              >
                <option value="">—</option>
                {industries.map((i) => (
                  <option key={i.nanoid} value={i.name}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-size">Size</Label>
              <select
                id="company-size"
                name="size"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                defaultValue=""
              >
                <option value="">—</option>
                {COMPANY_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {COMPANY_SIZE_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-tier">Tier</Label>
              <select
                id="company-tier"
                name="tier"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                defaultValue=""
              >
                <option value="">—</option>
                {tierClassifications.map((t) => (
                  <option key={t.nanoid} value={t.nanoid}>
                    {t.label} — {t.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-status">Status</Label>
              <select
                id="company-status"
                name="status"
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                defaultValue="identified"
              >
                {BOARD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PROSPECT_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="company-country">Country</Label>
              <Input id="company-country" name="country" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company-city">City</Label>
              <Input id="company-city" name="city" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-address">Address</Label>
            <Input id="company-address" name="address" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-listings">Total listings</Label>
            <Input
              id="company-listings"
              name="total_listings"
              type="number"
              min={0}
              step={1}
              aria-invalid={!!errors.total_listings}
            />
            {errors.total_listings?.[0] ? (
              <p className="text-xs text-destructive">
                {errors.total_listings[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Phone numbers</Label>
            {phoneEntries.map((p, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={p}
                  onChange={(e) => {
                    const next = [...phoneEntries];
                    next[i] = e.target.value;
                    setPhoneEntries(next);
                  }}
                  placeholder="+1 555 0100"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    setPhoneEntries(phoneEntries.filter((_, idx) => idx !== i))
                  }
                  disabled={phoneEntries.length === 1}
                  aria-label="Remove phone"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setPhoneEntries([...phoneEntries, ""])}
            >
              + Add phone
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label>Social links</Label>
            {socialEntries.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input
                  value={s.url}
                  onChange={(e) => {
                    const next = [...socialEntries];
                    next[i] = { ...next[i], url: e.target.value };
                    setSocialEntries(next);
                  }}
                  placeholder="https://…"
                  aria-invalid={!!errors[`social_links.${i}.url`]}
                />
                <Input
                  value={s.name}
                  onChange={(e) => {
                    const next = [...socialEntries];
                    next[i] = { ...next[i], name: e.target.value };
                    setSocialEntries(next);
                  }}
                  placeholder="Label (optional)"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    setSocialEntries(socialEntries.filter((_, idx) => idx !== i))
                  }
                  disabled={socialEntries.length === 1}
                  aria-label="Remove link"
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() =>
                setSocialEntries([...socialEntries, { url: "", name: "" }])
              }
            >
              + Add link
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="company-about">About</Label>
            <textarea
              id="company-about"
              name="about"
              rows={3}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="verified"
              className="size-4 rounded border-input"
            />
            Verified
          </label>

          {formError ? (
            <div
              role="alert"
              className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <DialogFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Company"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddTierDialog({
  open,
  onOpenChange,
  workspace,
  tierState,
  tierFormAction,
  tierPending,
  newTierTitle,
  setNewTierTitle,
  newTierLabel,
  setNewTierLabel,
  newTierDescription,
  setNewTierDescription,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspace: { nanoid: string; name: string; domain: string };
  tierState: CreateTierClassificationActionState;
  tierFormAction: (formData: FormData) => Promise<CreateTierClassificationActionState> | void;
  tierPending: boolean;
  newTierTitle: string;
  setNewTierTitle: (v: string) => void;
  newTierLabel: string;
  setNewTierLabel: (v: string) => void;
  newTierDescription: string;
  setNewTierDescription: (v: string) => void;
}) {
  const toast = useToast();

  useEffect(() => {
    if (tierState.status === "success") {
      toast.push({
        variant: "success",
        message: tierState.message ?? "Tier created.",
      });
      onOpenChange(false);
      setNewTierTitle("");
      setNewTierLabel("");
      setNewTierDescription("");
    } else if (tierState.status === "error") {
      toast.push({
        variant: "error",
        message: tierState.message ?? "Could not create tier.",
      });
    }
  }, [tierState, toast, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md gap-0 overflow-hidden p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader className="rounded-t-xl bg-primary px-5 py-4">
          <DialogTitle className="text-primary-foreground">
            New Tier
          </DialogTitle>
        </DialogHeader>
        <form
          action={(submitted) => {
            submitted.set("workspace_domain", workspace.domain);
            tierFormAction(submitted);
          }}
          className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4"
        >
          <input type="hidden" name="workspace_domain" value={workspace.domain} />
          <div className="space-y-1.5">
            <Label htmlFor="tier-title">Title</Label>
            <Input
              id="tier-title"
              name="title"
              value={newTierTitle}
              onChange={(e) => setNewTierTitle(e.target.value)}
              placeholder="e.g. Strategic"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tier-label">Label</Label>
            <Input
              id="tier-label"
              name="label"
              value={newTierLabel}
              onChange={(e) => setNewTierLabel(e.target.value)}
              placeholder="e.g. A"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tier-description">Description</Label>
            <textarea
              id="tier-description"
              name="description"
              rows={3}
              value={newTierDescription}
              onChange={(e) => setNewTierDescription(e.target.value)}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              placeholder="Optional description"
            />
          </div>
          <DialogFooter className="px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={tierPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={tierPending}>
              {tierPending ? "Saving…" : "Save Tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
