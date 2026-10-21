"use client";

import { Archive } from "@/lib/icons";
import type { Company } from "@/lib/api";

interface Props {
  company: Company;
  /** Whether the record is currently in edit mode. */
  editing: boolean;
}

/**
 * The company record's meta row.
 *
 * The name and the prospect stage live in the page banner now, and the
 * "Companies" pill in the nav strip is the way back, so this row only
 * carries what neither of them can: the archive state and a note when the
 * record is in edit mode.
 *
 * The record actions (edit, add contact, archive, delete) live in the
 * "Actions" menu in the page header.
 */
export function RecordHeader({ company, editing }: Props) {
  return (
    <div className="space-y-3">
      {/* The banner shows the name; this keeps the page's heading for
          assistive technology and search engines. */}
      <h1 className="sr-only">{company.name}</h1>

      <div className="flex flex-wrap items-center gap-3">
        {company.archived ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            <Archive className="size-3.5" aria-hidden="true" />
            Archived
          </span>
        ) : null}
        {editing ? (
          <span className="text-xs text-muted-foreground">
            Edit mode is on — every field on this record now has a pencil.
          </span>
        ) : null}
      </div>
    </div>
  );
}
