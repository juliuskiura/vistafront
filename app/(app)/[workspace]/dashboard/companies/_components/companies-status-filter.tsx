"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PROSPECT_LABELS } from "@/lib/crm/constants";
import type { ProspectStatus } from "@/lib/api";
import { BOARD_STATUSES } from "@/lib/crm/constants";

/**
 * The "Open stages" quick filter.
 *
 * The backend filters on `status__in`, so a comma-separated list narrows to
 * several stages at once. "Open stages" is everything except the two
 * terminal states — a customer and a lost deal are closed, and a
 * lead-management view almost always wants the rest.
 */
export const OPEN_STAGE_STATUSES: ProspectStatus[] = BOARD_STATUSES.filter(
  (s) => s !== "customer" && s !== "lost",
);

export const OPEN_STAGES_PARAM = OPEN_STAGE_STATUSES.join(",");

interface Props {
  /** The comma-separated list of selected statuses. */
  status: string;
  onStatusChange: (status: string) => void;
}

/**
 * Multi-status filter.
 *
 * A dropdown of checkboxes rather than a single `<select>`, because the
 * backend accepts several statuses at once and a lead-management view
 * almost always wants more than one.
 */
export function CompaniesStatusFilter({ status, onStatusChange }: Props) {
  const [open, setOpen] = useState(false);
  const selected = status ? status.split(",").filter(Boolean) : [];

  const toggle = (value: ProspectStatus) => {
    const next = selected.includes(value)
      ? selected.filter((s) => s !== value)
      : [...selected, value];
    onStatusChange(next.join(","));
  };

  const isOpenStagesOnly = status === OPEN_STAGES_PARAM;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant={isOpenStagesOnly ? "default" : "outline"}
        onClick={() => onStatusChange(isOpenStagesOnly ? "" : OPEN_STAGES_PARAM)}
        aria-pressed={isOpenStagesOnly}
      >
        Open stages
      </Button>

      <div className="relative">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
        >
          {selected.length > 0 ? `Stages (${selected.length})` : "All stages"}
        </Button>
        {open ? (
          <div
            role="group"
            aria-label="Filter by status"
            className="absolute left-0 z-20 mt-1 w-52 rounded-xl border bg-popover p-1 shadow-md"
          >
            {BOARD_STATUSES.map((s) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(s)}
                  onChange={() => toggle(s)}
                  className="size-4 rounded border-input"
                />
                {PROSPECT_LABELS[s]}
              </label>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
