"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "@/lib/icons";
import type { Industry } from "@/lib/api";
import { useToast } from "@/lib/context";
import { createIndustryAction } from "@/app/(app)/[workspace]/dashboard/companies/actions";

interface Props {
  id: string;
  label: string;
  industries: Industry[];
  workspaceDomain: string;
  /** The selected industry name. */
  value: string;
  onChange: (value: string) => void;
  /** The label of the empty option. */
  emptyLabel?: string;
  /** The select's class, so a filter bar can style it differently. */
  className?: string;
  /** Hide the label — the filter bar labels its own controls. */
  hideLabel?: boolean;
}

/**
 * An industry picker that can create an industry on the fly.
 *
 * The backend has a `POST /apis/crm/industries/` endpoint, and the legacy
 * app used it: the user types a name that does not exist yet and it is
 * created and selected in one step. The alternative — leaving the field
 * empty and asking someone to fix the reference data first — is a dead end
 * for the person actually entering the company.
 *
 * The picker is controlled: the selected name is a prop, not internal
 * state. That is what lets the same component serve the add-company form
 * (a plain form field), the companies filter (a URL-backed filter) and the
 * company record's inline editor (a per-field draft) without three
 * different implementations.
 */
export function IndustryPicker({
  id,
  label,
  industries,
  workspaceDomain,
  value,
  onChange,
  emptyLabel = "—",
  className,
  hideLabel = false,
}: Props) {
  const router = useRouter();
  const toast = useToast();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [pending, startTransition] = useTransition();
  // The industry that was just created, kept local so the new value is
  // selectable before the server round-trip refreshes the list.
  const [justCreated, setJustCreated] = useState<string | null>(null);

  const options = industries.map((i) => i.name);
  if (justCreated && !options.includes(justCreated)) {
    options.push(justCreated);
  }

  const startCreating = () => {
    setCreating(true);
    setNewName("");
  };

  const submitNew = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await createIndustryAction({
        workspaceDomain,
        name: trimmed,
      });
      if (result.status === "success") {
        setJustCreated(trimmed);
        onChange(trimmed);
        setCreating(false);
        setNewName("");
        toast.push({
          variant: "success",
          message: `Industry “${trimmed}” created.`,
        });
        router.refresh();
      } else {
        toast.push({
          variant: "error",
          message: result.message ?? "Could not create the industry.",
        });
      }
    });
  };

  if (creating) {
    return (
      <div className="space-y-1.5">
        {hideLabel ? null : <Label htmlFor={`${id}-new`}>{label}</Label>}
        <div className="flex gap-2">
          <Input
            id={`${id}-new`}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New industry name…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNew();
              }
            }}
            aria-label="New industry name"
          />
          <Button
            type="button"
            size="sm"
            onClick={submitNew}
            disabled={pending || !newName.trim()}
          >
            {pending ? "Adding…" : "Add"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setCreating(false)}
            disabled={pending}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {hideLabel ? null : <Label htmlFor={id}>{label}</Label>}
      <div className="flex gap-2">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={
            className ??
            "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          }
        >
          <option value="">{emptyLabel}</option>
          {options.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={startCreating}
          disabled={pending}
          aria-label="Create a new industry"
          title="Create a new industry"
        >
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
