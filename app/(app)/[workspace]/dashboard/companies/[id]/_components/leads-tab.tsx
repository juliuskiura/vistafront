"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import { useToast } from "@/lib/context";
import {
  createLeadAction,
  deleteLeadAction,
} from "@/app/(app)/[workspace]/dashboard/companies/[id]/record-lead-actions";
import type { Lead } from "@/lib/api";
import { DeleteRowButton, EmptyTab, TabCard } from "./record-list";

interface Props {
  company: { nanoid: string; name: string };
  workspaceDomain: string;
  leads: Lead[];
}

/** The lead stages a company can be in. */
const LEAD_STATUSES = ["new", "contacted", "qualified", "converted", "disqualified"];

const LEAD_SOURCES = [
  "Website",
  "Referral",
  "Cold outreach",
  "Event",
  "Social media",
  "Other",
];

/**
 * The leads tab.
 *
 * A lead is a qualified contact on the company — the point at which a
 * prospect becomes something you can actually work with.
 */
export function LeadsTab({ company, workspaceDomain, leads }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const [source, setSource] = useState(LEAD_SOURCES[0]);
  const [status, setStatus] = useState(LEAD_STATUSES[0]);
  const [notes, setNotes] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await createLeadAction({
        workspaceDomain,
        company: company.nanoid,
        source,
        status,
        notes: notes || undefined,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Lead added." });
        setAdding(false);
        setNotes("");
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not add the lead.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteLeadAction({
        workspaceDomain,
        nanoid: deleting,
        company: company.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Lead deleted." });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the lead.",
        });
      }
      setDeleting(null);
    });
  };

  if (leads.length === 0 && !adding) {
    return (
      <EmptyTab
        title="No leads yet"
        description="Once a prospect qualifies, record them as a lead here."
        action={
          <Button type="button" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add lead
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <TabCard
        title="Leads"
        description={`${leads.length} recorded`}
        action={
          <Button type="button" size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add
          </Button>
        }
      >
        {adding ? (
          <div className="space-y-3 bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="lead-source">Source *</Label>
                <select
                  id="lead-source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {LEAD_SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lead-status">Status *</Label>
                <select
                  id="lead-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                >
                  {LEAD_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lead-notes">Notes</Label>
              <textarea
                id="lead-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={submit} disabled={pending}>
                {pending ? "Saving…" : "Save lead"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAdding(false)}
                disabled={pending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : null}

        {leads.map((lead) => (
          <div key={lead.nanoid} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{lead.source}</p>
              <p className="text-xs text-muted-foreground">
                {lead.status}
                {lead.contact_name ? ` · ${lead.contact_name}` : ""}
                {" · "}
                {formatMediumDate(lead.created_at)}
              </p>
              {lead.notes ? (
                <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                  {lead.notes}
                </p>
              ) : null}
            </div>
            <DeleteRowButton
              onDelete={() => setDeleting(lead.nanoid)}
              label={`Delete lead from ${lead.source}`}
              pending={pending}
            />
          </div>
        ))}
      </TabCard>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete lead?"
        description="This lead will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
