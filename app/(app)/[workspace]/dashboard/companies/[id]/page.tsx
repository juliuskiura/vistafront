import Link from "next/link";

import {
  getCompany,
  listActionTypes,
  listActivities,
  listContacts,
  listCountries,
  listDeals,
  listIndustries,
  listLeads,
  listNoteTypes,
  listObservations,
  listObservationCategories,
  listRelatableModels,
  listTierClassifications,
  type ActionType,
  type Activity,
  type Contact,
  type Country,
  type Deal,
  type Industry,
  type Lead,
  type NoteTypeOption,
  type Observation,
  type ObservationCategory,
  type RelatableModel,
  type TierClassification,
} from "@/lib/api";
import { listNotes } from "@/lib/api/notebook";
import type { Note } from "@/lib/api/types";
import { requireWorkspace } from "@/lib/auth/server";
import { Banner } from "@/components/banner";
import { CrmInnerNav } from "@/components/crm";
import { PROSPECT_LABELS, STATUS_COLORS } from "@/lib/crm/constants";
import { AdvanceStageButton } from "./_components/advance-stage-button";
import { RecordActionsMenu } from "./_components/record-actions-menu";
import { SocialChannels } from "./_components/social-channels";
import { CompanyRecord } from "@/app/(app)/[workspace]/dashboard/companies/[id]/company-record";

/** The tabs the record offers, in order. */
const VALID_TABS = [
  "overview",
  "observations",
  "activities",
  "leads",
  "contacts",
  "deals",
  "notes",
] as const;

/**
 * Company record (Server Component).
 *
 * Reads `?tab=` (default `overview`) and `?edit=1` from the URL, fetches
 * the company and the data for the active tab, and hands it all to the
 * client shell.
 *
 * The tab lives in the URL so the view survives a refresh and can be
 * shared; `edit=1` is the same contract the legacy app used for the bulk
 * "Edit" button.
 */
export default async function CompanyDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string; id: string }>;
  searchParams: Promise<{ tab?: string; edit?: string }>;
}) {
  const { workspace: slug, id } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);

  const company = await getCompany(id, active.domain).catch(() => null);

  if (!company) {
    return (
      <div className="max-w-3xl">
        <Link
          href={`/${active.domain}/dashboard/companies`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Companies
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Company not found</h1>
      </div>
    );
  }

  const requestedTab = (sp.tab ?? "overview").trim();
  const activeTab = (VALID_TABS as readonly string[]).includes(requestedTab)
    ? requestedTab
    : "overview";
  const editing = sp.edit === "1";

  // An archived company keeps every record it has — they are only hidden
  // from the working lists — so the record asks for them explicitly.
  const archived = company.archived ? "all" : undefined;

  // Everything the record needs is fetched in parallel, each with the
  // workspace header so the tenant middleware resolves the right slice.
  const [
    countries,
    industries,
    tierClassifications,
    contacts,
    deals,
    observations,
    activities,
    leads,
    notes,
    noteTypes,
    relatableModels,
    actionTypes,
    observationCategories,
  ] = await Promise.all([
    listCountries(active.domain).catch(() => [] as Country[]),
    listIndustries(active.domain).catch(() => [] as Industry[]),
    listTierClassifications(active.domain).catch(
      () => [] as TierClassification[],
    ),
    listContacts({
      company: company.nanoid,
      archived,
      workspace: active.domain,
    }).catch(() => [] as Contact[]),
    listDeals({ archived, workspace: active.domain }).catch(() => [] as Deal[]),
    listObservations({
      company: company.nanoid,
      archived,
      workspace: active.domain,
    }).catch(() => [] as Observation[]),
    listActivities({
      company: company.nanoid,
      archived,
      workspace: active.domain,
    }).catch(() => [] as Activity[]),
    listLeads({
      company: company.nanoid,
      archived,
      workspace: active.domain,
    }).catch(() => [] as Lead[]),
    listNotes({
      relatable: "company",
      object_nanoid: company.nanoid,
      workspace: active.domain,
    }).catch(() => [] as Note[]),
    listNoteTypes(active.domain).catch(() => [] as NoteTypeOption[]),
    listRelatableModels(active.domain).catch(() => [] as RelatableModel[]),
    listActionTypes(active.domain).catch(() => [] as ActionType[]),
    listObservationCategories(active.domain).catch(
      () => [] as ObservationCategory[],
    ),
  ]);

  // The company-scoped deal list needs a second pass: the backend's deal
  // list endpoint has no `?company=` filter, so the records are matched
  // client-side of the fetch.
  const companyDeals = deals.filter(
    (d) => d.company === company.nanoid,
  );

  const companyRelatable =
    relatableModels.find((m) => m.key === "company") ?? null;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        className="md:flex-col md:items-stretch md:justify-start md:gap-4"
        title={company.name}
        titleExtra={
          <span
            className={`rounded-full px-3 py-1 text-sm font-medium ring-1 ring-white/40 ${STATUS_COLORS[company.status] ?? ""}`}
          >
            {PROSPECT_LABELS[company.status]}
          </span>
        }
        description={`${company.industry || "Company"} — ${
          company.domain || "no website"
        }`}
        actions={[
          {
            label: "Company header",
            node: (
              <div className="flex w-full flex-wrap items-center gap-3">
                <SocialChannels
                  links={company.social_links ?? []}
                  companyNanoid={company.nanoid}
                  workspaceDomain={active.domain}
                  tone="banner"
                />
                <div className="ml-auto">
                  <RecordActionsMenu
                    company={company}
                    workspaceDomain={active.domain}
                    activeTab={activeTab}
                    editing={editing}
                  />
                </div>
              </div>
            ),
          },
        ]}
      />
      <CrmInnerNav
        workspaceDomain={active.domain}
        trailing={
          <AdvanceStageButton
            status={company.status}
            workspaceDomain={active.domain}
            companyNanoid={company.nanoid}
          />
        }
      />
      <div className="mt-6 flex-1">
        <CompanyRecord
          company={company}
          workspaceDomain={active.domain}
          activeTab={activeTab}
          editing={editing}
          countries={countries}
          industries={industries}
          tierClassifications={tierClassifications}
          counts={{
            observations: observations.length,
            activities: activities.length,
            leads: leads.length,
            contacts: contacts.length,
            deals: companyDeals.length,
            notes: notes.length,
          }}
          contacts={contacts}
          deals={companyDeals}
          observations={observations}
          activities={activities}
          leads={leads}
          notes={notes}
          noteTypes={noteTypes}
          relatableNanoid={companyRelatable?.nanoid ?? null}
          actionTypes={actionTypes}
          observationCategories={observationCategories}
        />
      </div>
    </div>
  );
}
