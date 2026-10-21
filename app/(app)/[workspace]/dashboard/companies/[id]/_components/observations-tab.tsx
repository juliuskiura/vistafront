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
  createObservationAction,
  deleteObservationAction,
} from "@/app/(app)/[workspace]/dashboard/companies/[id]/record-data-actions";
import type { Observation } from "@/lib/api";
import { DeleteRowButton, EmptyTab, TabCard } from "./record-list";

interface Props {
  company: { nanoid: string; name: string };
  workspaceDomain: string;
  observations: Observation[];
  observationCategories: { nanoid: string; name: string }[];
}

/**
 * The observations tab.
 *
 * An observation is a note about a company: what was noticed, how severe
 * it is, and what the opportunity is. The category comes from the
 * backend's category list; if that list is empty the tab falls back to
 * free text rather than being a dead end.
 */
export function ObservationsTab({
  company,
  workspaceDomain,
  observations,
  observationCategories,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(observationCategories[0]?.nanoid ?? "");
  const [severity, setSeverity] = useState("1");
  const [opportunity, setOpportunity] = useState("");
  const [description, setDescription] = useState("");

  const submit = () => {
    startTransition(async () => {
      const result = await createObservationAction({
        workspaceDomain,
        company: company.nanoid,
        category,
        title,
        description: description || undefined,
        severity: Number(severity) || undefined,
        opportunity: opportunity || undefined,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Observation added." });
        setAdding(false);
        setTitle("");
        setOpportunity("");
        setDescription("");
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not add the observation.",
        });
      }
    });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    startTransition(async () => {
      const result = await deleteObservationAction({
        workspaceDomain,
        nanoid: deleting,
        company: company.nanoid,
      });
      if (result.status === "success") {
        toast.push({ variant: "success", message: "Observation deleted." });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not delete the observation.",
        });
      }
      setDeleting(null);
    });
  };

  if (observations.length === 0 && !adding) {
    return (
      <EmptyTab
        title="No observations yet"
        description="Record what you notice about this company — a signal, a risk, an opening."
        action={
          <Button type="button" onClick={() => setAdding(true)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add observation
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      <TabCard
        title="Observations"
        description={`${observations.length} recorded`}
        action={
          <Button type="button" size="sm" onClick={() => setAdding((v) => !v)}>
            <Plus className="mr-1.5 size-4" aria-hidden="true" />
            Add
          </Button>
        }
      >
        {adding ? (
          <div className="space-y-3 bg-muted/30 p-4">
            <div className="space-y-1.5">
              <Label htmlFor="observation-title">Title *</Label>
              <Input
                id="observation-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What did you notice?"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="observation-category">Category</Label>
                {observationCategories.length > 0 ? (
                  <select
                    id="observation-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                  >
                    {observationCategories.map((c) => (
                      <option key={c.nanoid} value={c.nanoid}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id="observation-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Category name"
                  />
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observation-severity">Severity</Label>
                <Input
                  id="observation-severity"
                  type="number"
                  min={1}
                  max={5}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="observation-opportunity">Opportunity</Label>
                <Input
                  id="observation-opportunity"
                  value={opportunity}
                  onChange={(e) => setOpportunity(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observation-description">Description</Label>
              <textarea
                id="observation-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
              />
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={submit}
                disabled={pending || !title.trim() || !category.trim()}
              >
                {pending ? "Saving…" : "Save observation"}
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

        {observations.map((o) => (
          <div key={o.nanoid} className="flex items-start gap-3 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{o.title}</p>
              <p className="text-xs text-muted-foreground">
                {o.category_name}
                {o.severity ? ` · severity ${o.severity}` : ""}
                {o.opportunity ? ` · ${o.opportunity}` : ""}
                {" · "}
                {formatMediumDate(o.created_at)}
              </p>
              {o.description ? (
                <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">
                  {o.description}
                </p>
              ) : null}
            </div>
            <DeleteRowButton
              onDelete={() => setDeleting(o.nanoid)}
              label={`Delete observation ${o.title}`}
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
        title="Delete observation?"
        description="This observation will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        confirming={pending}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
