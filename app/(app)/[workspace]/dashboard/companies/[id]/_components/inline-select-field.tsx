"use client";

import { InlineField } from "./inline-field";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label: string;
  field: string;
  value: string;
  options: Option[];
  workspaceDomain: string;
  companyNanoid: string;
  editing: boolean;
  onSaved?: () => void;
  /** Rendered when the value does not match any option. */
  fallback?: React.ReactNode;
}

/**
 * An inline editor backed by a `<select>`.
 *
 * Used for the fields that have a fixed set of values — the prospect
 * status, the company size, the country (a 2-letter code) and the tier.
 */
export function InlineSelectField({
  label,
  field,
  value,
  options,
  workspaceDomain,
  companyNanoid,
  editing,
  onSaved,
  fallback,
}: Props) {
  const match = options.find((o) => o.value === value);

  return (
    <InlineField
      label={label}
      field={field}
      display={match ? match.label : (fallback ?? value)}
      rawValue={value}
      workspaceDomain={workspaceDomain}
      companyNanoid={companyNanoid}
      editing={editing}
      onSaved={onSaved}
    >
      {(draft, setDraft) => (
        <select
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={`Edit ${label}`}
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          autoFocus
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </InlineField>
  );
}
