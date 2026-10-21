"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BOARD_STATUSES,
  COMPANY_SIZES,
  COMPANY_SIZE_LABELS,
  PROSPECT_LABELS,
} from "@/lib/crm/constants";
import type {
  Country,
  Industry,
  TierClassification,
} from "@/lib/api";
import { CountrySelect } from "./country-select";
import { IndustrySelect } from "./industry-select";

interface Props {
  industries: Industry[];
  tierClassifications: TierClassification[];
  countries: Country[];
  workspaceDomain: string;
  errors: Record<string, string[] | undefined>;
}

/**
 * The static part of the company form — everything that is a single value
 * rather than a repeatable row.
 */
export function CompanyFormFields({
  industries,
  tierClassifications,
  countries,
  workspaceDomain,
  errors,
}: Props) {
  return (
    <>
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
        <IndustrySelect
          id="company-industry"
          name="industry"
          label="Industry"
          industries={industries}
          workspaceDomain={workspaceDomain}
        />
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
        <CountrySelect
          id="company-country"
          name="country"
          label="Country"
          countries={countries}
        />
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

    </>
  );
}
