"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "@/lib/icons";

/** The repeatable phone-number rows on the company form. */
export function PhoneNumbersField({
  entries,
  onChange,
}: {
  entries: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Phone numbers</Label>
      {entries.map((p, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={p}
            onChange={(e) => {
              const next = [...entries];
              next[i] = e.target.value;
              onChange(next);
            }}
            placeholder="+1 555 0100"
            aria-label={`Phone number ${i + 1}`}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
            disabled={entries.length === 1}
            aria-label="Remove phone number"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange([...entries, ""])}
      >
        + Add phone
      </Button>
    </div>
  );
}

/** The repeatable social-link rows on the company form. */
export function SocialLinksField({
  entries,
  onChange,
}: {
  entries: { url: string; name: string }[];
  onChange: (next: { url: string; name: string }[]) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>Social links</Label>
      {entries.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <Input
            value={s.url}
            onChange={(e) => {
              const next = [...entries];
              next[i] = { ...next[i], url: e.target.value };
              onChange(next);
            }}
            placeholder="https://…"
            aria-label={`Social link ${i + 1} URL`}
          />
          <Input
            value={s.name}
            onChange={(e) => {
              const next = [...entries];
              next[i] = { ...next[i], name: e.target.value };
              onChange(next);
            }}
            placeholder="Label (optional)"
            aria-label={`Social link ${i + 1} label`}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => onChange(entries.filter((_, idx) => idx !== i))}
            disabled={entries.length === 1}
            aria-label="Remove link"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => onChange([...entries, { url: "", name: "" }])}
      >
        + Add link
      </Button>
    </div>
  );
}
