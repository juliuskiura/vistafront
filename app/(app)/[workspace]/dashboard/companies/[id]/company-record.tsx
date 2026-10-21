"use client";

import type {
  Activity,
  Company,
  Contact,
  Country,
  Deal,
  Industry,
  Lead,
  Observation,
  TierClassification,
} from "@/lib/api";
import type { Note } from "@/lib/api/types";
import { formatMediumDate } from "@/lib/dates";
import { Archive } from "@/lib/icons";
import { RecordHeader } from "./_components/record-header";
import { RecordTabs, type CompanyTab } from "./_components/record-tabs";
import { ProspectFlow } from "./_components/prospect-flow";
import { StatusSelect } from "./_components/status-select";
import { OverviewTab } from "./_components/overview-tab";
import { ContactsTab } from "./_components/contacts-tab";
import { DealsTab } from "./_components/deals-tab";
import { NotesTab } from "./_components/notes-tab";
import { ObservationsTab } from "./_components/observations-tab";
import { ActivitiesTab } from "./_components/activities-tab";
import { LeadsTab } from "./_components/leads-tab";

export const COMPANY_TABS: CompanyTab[] = [
  { key: "overview", label: "Overview" },
  { key: "observations", label: "Observations" },
  { key: "activities", label: "Activities" },
  { key: "leads", label: "Leads" },
  { key: "contacts", label: "Contacts" },
  { key: "deals", label: "Deals" },
  { key: "notes", label: "Notes" },
];

interface Props {
  company: Company;
  workspaceDomain: string;
  activeTab: string;
  editing: boolean;
  countries: Country[];
  industries: Industry[];
  tierClassifications: TierClassification[];
  counts: {
    observations: number;
    activities: number;
    leads: number;
    contacts: number;
    deals: number;
    notes: number;
  };
  contacts: Contact[];
  deals: Deal[];
  observations: Observation[];
  activities: Activity[];
  leads: Lead[];
  notes: Note[];
  actionTypes: { nanoid: string; name: string }[];
  observationCategories: { nanoid: string; name: string }[];
  /** The notebook note types a new note can be filed under. */
  noteTypes: { key: string; name: string }[];
  /**
   * The `RelatableModel` nanoid for the "company" record type.
   *
   * A note relation points at a *kind* of record and at the record
   * itself; this is the first half. It is looked up from the backend's
   * seed data rather than hard-coded.
   */
  relatableNanoid: string | null;
}

/**
 * The company record shell.
 *
 * Owns the tab strip and the record body. The server component supplies the
 * record and the per-tab data; this component decides what to show. The
 * record actions (edit, add contact, archive, delete) live in the overflow
 * menu at the end of the CRM nav strip.
 */
export function CompanyRecord(props: Props) {
  const {
    company,
    workspaceDomain,
    activeTab,
    editing,
    counts,
  } = props;

  const tabs: CompanyTab[] = COMPANY_TABS.map((tab) => {
    const countByKey: Record<string, number> = {
      observations: counts.observations,
      activities: counts.activities,
      leads: counts.leads,
      contacts: counts.contacts,
      deals: counts.deals,
      notes: counts.notes,
    };
    return countByKey[tab.key] === undefined
      ? tab
      : { ...tab, count: countByKey[tab.key] };
  });

  return (
    <div className="space-y-6">
      <RecordHeader company={company} editing={editing} />

      {company.archived ? (
        <div className="flex items-start gap-2 rounded-xl border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Archive className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            This company is archived
            {company.archived_at
              ? ` since ${formatMediumDate(company.archived_at)}`
              : ""}
            . It and its records are hidden from the working lists — restore it
            from the header above to bring them back.
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ProspectFlow status={company.status} />
        <StatusSelect
          status={company.status}
          workspaceDomain={workspaceDomain}
          companyNanoid={company.nanoid}
        />
      </div>

      <RecordTabs
        companyNanoid={company.nanoid}
        workspaceDomain={workspaceDomain}
        activeTab={activeTab}
        tabs={tabs}
        extraQuery={editing ? "edit=1" : undefined}
      />

      <div>
        {activeTab === "overview" ? (
          <OverviewTab
            company={company}
            countries={props.countries}
            industries={props.industries}
            tierClassifications={props.tierClassifications}
            workspaceDomain={workspaceDomain}
            editing={editing}
          />
        ) : null}
        {activeTab === "observations" ? (
          <ObservationsTab {...props} />
        ) : null}
        {activeTab === "activities" ? (
          <ActivitiesTab {...props} />
        ) : null}
        {activeTab === "leads" ? (
          <LeadsTab {...props} />
        ) : null}
        {activeTab === "contacts" ? (
          <ContactsTab {...props} />
        ) : null}
        {activeTab === "deals" ? (
          <DealsTab {...props} />
        ) : null}
        {activeTab === "notes" ? (
          <NotesTab {...props} />
        ) : null}
      </div>
    </div>
  );
}
