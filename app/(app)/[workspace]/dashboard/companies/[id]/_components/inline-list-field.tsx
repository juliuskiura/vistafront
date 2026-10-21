"use client";

import { Textarea } from "@/components/ui/textarea";

import { InlineField } from "./inline-field";

interface Props {
  label: string;
  field: string;
  /** The current value, already formatted for display. */
  display: React.ReactNode;
  /**
   * The raw value to seed the editor with.
   *
   * One entry per line — the editor is a textarea, so a value with newlines
   * survives the round trip. A single-line input would silently collapse
   * them into one entry.
   */
  rawValue: string;
  workspaceDomain: string;
  companyNanoid: string;
  editing: boolean;
  onSaved?: () => void;
  /** The editor's height, in rows. */
  rows?: number;
  placeholder?: string;
}

/**
 * An inline editor for a repeatable, one-entry-per-line value.
 *
 * The company's phone numbers and social links are lists, and the legacy
 * app edited them as one line per entry. A `<textarea>` is the editor that
 * matches: Enter inserts a newline instead of saving, so a phone number
 * list can actually be typed.
 */
export function InlineListField({
  label,
  field,
  display,
  rawValue,
  workspaceDomain,
  companyNanoid,
  editing,
  onSaved,
  rows = 4,
  placeholder,
}: Props) {
  return (
    <InlineField
      label={label}
      field={field}
      display={display}
      rawValue={rawValue}
      workspaceDomain={workspaceDomain}
      companyNanoid={companyNanoid}
      editing={editing}
      onSaved={onSaved}
    >
      {(draft, setDraft) => (
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          aria-label={`Edit ${label}`}
          className="text-sm"
          autoFocus
        />
      )}
    </InlineField>
  );
}
