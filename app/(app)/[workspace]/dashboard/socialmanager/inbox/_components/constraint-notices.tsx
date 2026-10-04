"use client";

import { AlertCircle, AlertTriangle } from "@/lib/icons";
import type { ConstraintWarning, MessageLimits } from "@/lib/api/inbox";

/**
 * The constraints the current draft breaks, said plainly.
 *
 * Two severities, one visual language: a hard limit (`error`) is what the
 * platform documents and will refuse, so it is red and the Send button is
 * blocked elsewhere; a soft one (`warning`) is something the platform may well
 * accept anyway — a bare link Instagram delivers as plain text — so it is amber
 * and the send still goes out. Both are shown because "sent" and "sent
 * correctly" are different things and the user is the one who can tell.
 */
export function ConstraintNotices({
  warnings,
  limits,
  draft,
}: {
  warnings: ConstraintWarning[];
  limits?: MessageLimits;
  draft: string;
}) {
  if (warnings.length === 0) return null;

  return (
    <ul className="flex flex-col gap-1.5" aria-live="polite">
      {warnings.map((warning) => (
        <li
          key={warning.code}
          className={
            warning.severity === "error"
              ? "flex items-start gap-1.5 rounded-md bg-red-50 p-2 text-xs text-red-700"
              : "flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-xs text-amber-800"
          }
        >
          {warning.severity === "error" ? (
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>
            {warning.message}
            {warning.severity === "warning" && (
              <span className="block opacity-80">
                This will still be sent — check it is what you meant.
              </span>
            )}
          </span>
        </li>
      ))}
      <DraftCounter limits={limits} draft={draft} />
    </ul>
  );
}

/**
 * A live count in the unit the platform actually counts in.
 *
 * Instagram's limit is bytes and Messenger's is characters, so the counter
 * counts whatever `limits.counts_bytes` says — a counter in the wrong unit is
 * worse than none, because it says "fine" while the platform refuses.
 */
function DraftCounter({
  limits,
  draft,
}: {
  limits?: MessageLimits;
  draft: string;
}) {
  const limit = limits?.counts_bytes ? limits.max_bytes : limits?.max_characters;
  const measured = limits?.counts_bytes ? utf8Length(draft) : draft.length;
  const unit = limits?.counts_bytes ? "bytes" : "characters";
  if (!limit || measured <= limit * 0.8) return null;

  return (
    <li className="text-xs text-gray-500">
      {measured.toLocaleString()} / {limit.toLocaleString()} {unit}
    </li>
  );
}

/** Byte length of a string the browser has already given us as UTF-16. */
function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length;
}