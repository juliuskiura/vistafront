import Link from "next/link";

import {
  getNote,
  listNoteAttachments,
  listNoteTypes,
  type NoteAttachment,
  type NoteTypeOption,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";

import { NoteAttachments, NoteRelations } from "./_components/note-attachments";
import { NoteBody } from "./_components/note-body";
import { NoteHeader } from "./_components/note-header";
import { NoteMetaPanel } from "./_components/note-meta-panel";

/**
 * Note detail (Server Component).
 *
 * A single-column reading layout: the note body takes the full window width so
 * the editor has room to work. The editable metadata, attachments, and
 * relations sit below the body rather than in a side rail.
 *
 * The interactive slices — metadata edit, content edit, star/archive/delete —
 * are Client Component islands bound to Server Actions. Everything else,
 * including the note body, renders on the server.
 */
export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "notebook.notes");

  const note = await getNote(id, active.domain).catch(() => null);
  const basePath = `/${active.domain}/dashboard/notebook`;

  if (!note) {
    return (
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href={basePath}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          ← All notes
        </Link>
        <div className="mt-4 border-t border-[var(--nb-rule)] px-2 py-16 text-center">
          <h1 className="text-sm font-semibold">Note not found</h1>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            It may have been deleted, or the link may be wrong.
          </p>
          <Link
            href={basePath}
            className="mt-4 inline-flex h-8 items-center rounded-md border bg-background px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Back to notebook
          </Link>
        </div>
      </div>
    );
  }

  const [attachments, noteTypes] = await Promise.all([
    listNoteAttachments(note.nanoid, active.domain).catch(
      () => [] as NoteAttachment[],
    ),
    listNoteTypes(active.domain).catch(() => [] as NoteTypeOption[]),
  ]);

  const type = noteTypes.find((t) => String(t.key) === String(note.note_type)) ?? null;

  return (
    <div className="nb-page-glass flex min-h-full w-full flex-col gap-7 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
      <NoteHeader note={note} type={type} workspaceDomain={active.domain} />

      <NoteBody note={note} type={type} workspaceDomain={active.domain} />

      {/*
        Metadata and files, stacked under the body now that the rail is gone.
        The definition list stays in a measured column: it is a list of short
        values, and stretched across a wide window the labels drift too far
        from the values they describe.
      */}
      <div className="max-w-3xl space-y-6 border-t border-[var(--nb-rule)] pt-6">
        <NoteMetaPanel
          note={note}
          noteTypes={noteTypes}
          workspaceDomain={active.domain}
        />

        <NoteAttachments attachments={attachments} />
        <NoteRelations relations={note.relations} />
      </div>
    </div>
  );
}
