"use client";

import { Label } from "@/components/ui/label";
import type { Country } from "@/lib/api";

interface Props {
  id: string;
  name: string;
  label: string;
  countries: Country[];
  defaultValue?: string;
  required?: boolean;
}

/**
 * A country picker fed by `listCountries`.
 *
 * `Company.country` is a `django-countries` field: it stores a 2-letter
 * code, so the form must submit the *code* even though the user picks a
 * country by name. The backend serializer accepts the code and echoes back
 * the full country name, which is why the record view shows the name while
 * the edit control keeps the code.
 */
export function CountrySelect({
  id,
  name,
  label,
  countries,
  defaultValue = "",
  required,
}: Props) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      >
        <option value="">—</option>
        {countries.map((c) => (
          <option key={c.code} value={c.code}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
