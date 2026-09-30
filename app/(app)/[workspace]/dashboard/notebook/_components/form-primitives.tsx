/**
 * Shared form primitives for the Notebook's client islands.
 *
 * Extracted because three separate components render the same inputs, and
 * three copies of a focus-ring + invalid-border string is three chances to
 * drift apart.
 */

export const INPUT_CLASS =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 aria-[invalid=true]:border-destructive";

/** Renders the first Zod field error for an input, or nothing. */
export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.[0]) return null;
  return <p className="text-xs text-destructive">{errors[0]}</p>;
}
