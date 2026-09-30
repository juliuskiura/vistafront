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

import { NoteDetail } from "./_components/note-detail";

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
    <div className="nb-page-glass min-h-full w-full px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      {/*
        One surface for the whole note. The radius, the shadow and the clip
        live here rather than on the editor, so the title and the body read as
        a single object — the editor used to carry the surface alone, which
        boxed the prose and left the title floating on the page above it.
      */}
      <article className="nb-sheet mx-auto w-full max-w-6xl">
        <NoteDetail
          note={note}
          type={type}
          attachments={attachments}
          workspaceDomain={active.domain}
        />
      </article>
    </div>
  );
}
