"use client";

import { InlineField } from "./inline-field";

interface Props {
  label: string;
  field: string;
  value: boolean;
  workspaceDomain: string;
  companyNanoid: string;
  editing: boolean;
  onSaved?: () => void;
}

/**
 * An inline editor for a boolean field.
 *
 * The editor is a two-button toggle rather than a checkbox, because the
 * value has to be sent as the string `"true"` / `"false"` to the field
 * action — a checkbox would have to be read out of the DOM.
 */
export function InlineBooleanField({
  label,
  field,
  value,
  workspaceDomain,
  companyNanoid,
  editing,
  onSaved,
}: Props) {
  return (
    <InlineField
      label={label}
      field={field}
      display={value ? "Yes" : "No"}
      rawValue={value ? "true" : "false"}
      workspaceDomain={workspaceDomain}
      companyNanoid={companyNanoid}
      editing={editing}
      onSaved={onSaved}
    >
      {() => <BooleanToggle draft={value} />}
    </InlineField>
  );
}

function BooleanToggle({ draft }: { draft: boolean }) {
  return (
    <span className="flex items-center gap-2" aria-hidden="true">
      <span
        className={`rounded-md px-2 py-1 text-xs font-medium ${
          draft
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {draft ? "Yes" : "No"}
      </span>
    </span>
  );
}
