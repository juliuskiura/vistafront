"use client";

import { Input } from "@/components/ui/input";
import { InlineField } from "./inline-field";

interface Props {
  label: string;
  field: string;
  value: number | null | undefined;
  workspaceDomain: string;
  companyNanoid: string;
  editing: boolean;
  onSaved?: () => void;
}

/**
 * An inline editor for a numeric field.
 *
 * The value is sent as a string and cast by the field action, so an empty
 * editor clears the field rather than writing `0`.
 */
export function InlineNumberField({
  label,
  field,
  value,
  workspaceDomain,
  companyNanoid,
  editing,
  onSaved,
}: Props) {
  const raw = value === null || value === undefined ? "" : String(value);

  return (
    <InlineField
      label={label}
      field={field}
      display={raw}
      rawValue={raw}
      workspaceDomain={workspaceDomain}
      companyNanoid={companyNanoid}
      editing={editing}
      onSaved={onSaved}
    >
      {(draft, setDraft) => (
        <Input
          type="number"
          min={0}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label={`Edit ${label}`}
          className="h-8"
          autoFocus
        />
      )}
    </InlineField>
  );
}
