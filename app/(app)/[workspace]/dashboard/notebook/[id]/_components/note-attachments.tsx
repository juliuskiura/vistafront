import { Paperclip } from "@/lib/icons";
import { formatMediumDate } from "@/lib/dates";
import type { NoteAttachment, NoteRelation } from "@/lib/api";

/* ──────────────────────────────────────────────────────────────────────
 * Attachments
 * ────────────────────────────────────────────────────────────────────── */

interface NoteAttachmentsProps {
  attachments: NoteAttachment[];
}

/** Formats a byte count for the file-size column. */
function formatSize(bytes: number | null): string {
  if (!bytes || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/**
 * Files attached to a note.
 *
 * Each row is one large link target with the filename as the accessible
 * name, so a screen reader announces "brief.pdf, 240 KB" rather than a bare
 * "Download" repeated down the list.
 */
export function NoteAttachments({ attachments }: NoteAttachmentsProps) {
  if (attachments.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Paperclip size={11} />
        Attachments
        <span className="font-normal normal-case tracking-normal text-muted-foreground/60">
          ({attachments.length})
        </span>
      </h2>

      <ul className="space-y-1">
        {attachments.map((att) => {
          const size = formatSize(att.size);
          return (
            <li key={att.nanoid}>
              <a
                href={att.file}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={
                  size ? `${att.original_name}, ${size}` : att.original_name
                }
                className="block rounded-md border bg-card px-3 py-2 transition-colors hover:bg-accent"
              >
                <span className="block truncate text-xs font-medium">
                  {att.original_name}
                </span>
                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                  {[
                    size,
                    att.uploaded_by_name ? `by ${att.uploaded_by_name}` : null,
                    formatMediumDate(att.created_at),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Relations
 * ────────────────────────────────────────────────────────────────────── */

interface NoteRelationsProps {
  relations: NoteRelation[];
}

/**
 * Other records this note is linked to (a company, a deal, a task…).
 *
 * `relatable_key` names the target model, so the chip can say what kind of
 * thing it points at rather than presenting an unlabelled string.
 */
export function NoteRelations({ relations }: NoteRelationsProps) {
  if (relations.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        Related to
      </h2>
      <ul className="flex flex-wrap gap-1.5">
        {relations.map((rel) => (
          <li key={rel.nanoid}>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2 py-0.5 text-[11px]">
              {rel.label}
              {rel.relatable_key ? (
                <span className="text-muted-foreground/60">
                  {rel.relatable_key.replace(/s$/, "")}
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
