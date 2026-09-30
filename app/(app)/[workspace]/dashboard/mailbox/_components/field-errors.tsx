"use client";

/**
 * Renders the field-level error map produced by a Zod `safeParse` failure.
 *
 * Shared by the mailbox settings forms. Lives on its own because both the
 * mailbox form and the domain form need it, and duplicating it would let the
 * two drift.
 */
export function FieldErrors({
  errors,
}: {
  errors?: Record<string, string[] | undefined>;
}) {
  if (!errors) return null;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string[]] => Array.isArray(entry[1]),
  );
  if (entries.length === 0) return null;

  return (
    <>
      {entries.map(([field, messages]) =>
        messages.map((msg) => (
          <p key={`${field}-${msg}`} className="mt-1 text-xs text-destructive">
            {msg}
          </p>
        )),
      )}
    </>
  );
}
