"use client";

import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMPANY_SIZES, COMPANY_SIZE_LABELS } from "@/lib/crm/constants";
import type {
  Company,
  Country,
  Industry,
  TierClassification,
} from "@/lib/api";
import { IndustryPicker } from "../../_components/industry-picker";
import { AboutField } from "./about-field";
import { InlineField } from "./inline-field";
import { InlineListField } from "./inline-list-field";
import { InlineSelectField } from "./inline-select-field";
import { InlineNumberField } from "./inline-number-field";
import { InlineBooleanField } from "./inline-boolean-field";

interface Props {
  company: Company;
  countries: Country[];
  industries: Industry[];
  tierClassifications: TierClassification[];
  workspaceDomain: string;
  editing: boolean;
}

/**
 * The overview tab — every company field, each editable on its own.
 *
 * The edit affordances follow the legacy pattern: the record has an Edit
 * toggle, and only while it is on does each field grow a pencil. Saving a
 * field sends just that field, so one bad value can never overwrite the
 * rest of the record.
 */
export function OverviewTab({
  company,
  countries,
  industries,
  tierClassifications,
  workspaceDomain,
  editing,
}: Props) {
  const router = useRouter();
  const refresh = () => router.refresh();

  const countryName =
    countries.find((c) => c.code === company.country)?.name ??
    company.country ??
    "";

  const tierLabel = company.tier_label ?? "";

  return (
    <div className="space-y-6">
      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <InlineField
              label="Name"
              field="name"
              display={company.name}
              rawValue={company.name}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineField
              label="Website"
              field="domain"
              display={company.domain}
              rawValue={company.domain ?? ""}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineField
              label="Email"
              field="email"
              display={company.email}
              rawValue={company.email ?? ""}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineSelectField
              label="Size"
              field="size"
              value={company.size ?? ""}
              options={[
                { value: "", label: "—" },
                ...COMPANY_SIZES.map((s) => ({
                  value: s,
                  label: COMPANY_SIZE_LABELS[s],
                })),
              ]}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineSelectField
              label="Country"
              field="country"
              value={company.country ?? ""}
              options={[
                { value: "", label: "—" },
                ...countries.map((c) => ({ value: c.code, label: c.name })),
              ]}
              fallback={countryName}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineField
              label="City"
              field="city"
              display={company.city}
              rawValue={company.city ?? ""}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineField
              label="Address"
              field="address"
              display={company.address}
              rawValue={company.address ?? ""}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineField
              label="Industry"
              field="industry"
              display={company.industry ?? ""}
              rawValue={company.industry ?? ""}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            >
              {(draft, setDraft) => (
                <IndustryPicker
                  id="company-industry"
                  label="Industry"
                  industries={industries}
                  workspaceDomain={workspaceDomain}
                  value={draft}
                  onChange={setDraft}
                />
              )}
            </InlineField>
            <InlineSelectField
              label="Tier"
              field="tier"
              value={company.tier ?? ""}
              options={[
                { value: "", label: "—" },
                ...tierClassifications.map((t) => ({
                  value: t.nanoid,
                  label: `${t.label} — ${t.title}`,
                })),
              ]}
              fallback={tierLabel}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineBooleanField
              label="Verified"
              field="verified"
              value={company.verified ?? false}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
            <InlineNumberField
              label="Total listings"
              field="total_listings"
              value={company.total_listings}
              workspaceDomain={workspaceDomain}
              companyNanoid={company.nanoid}
              editing={editing}
              onSaved={refresh}
            />
          </dl>
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle>Phone numbers</CardTitle>
        </CardHeader>
        <CardContent>
          <InlineListField
            label="One number per line"
            field="phone_numbers"
            display={
              company.phone_numbers && company.phone_numbers.length > 0
                ? company.phone_numbers.join(", ")
                : ""
            }
            rawValue={(company.phone_numbers ?? []).join("\n")}
            workspaceDomain={workspaceDomain}
            companyNanoid={company.nanoid}
            editing={editing}
            onSaved={refresh}
            placeholder="+44 20 7946 0000"
          />
        </CardContent>
      </Card>

      <Card className="rounded-xl border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold tracking-tight">About</CardTitle>
        </CardHeader>
        <CardContent>
          <AboutField
            about={company.about}
            workspaceDomain={workspaceDomain}
            companyNanoid={company.nanoid}
            editing={editing}
            onSaved={refresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}
