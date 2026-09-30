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
import { NoteContentEditor } from "./_components/note-content-editor";
import { NoteHeader } from "./_components/note-header";
import { NoteMetaPanel } from "./_components/note-meta-panel";
import { NoteReader } from "./_components/note-reader";

/**
 * Note detail (Server Component).
 *
 * A two-column reading layout: the note body in a measured column on the
 * left, and a sticky properties rail on the right carrying the editable
 * metadata, attachments, and relations. The rail is sticky so the file list
 * stays reachable in a long note without scrolling the prose away.
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
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <NoteHeader note={note} type={type} workspaceDomain={active.domain} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* ── Reading column ──────────────────────────────────── */}
        <div className="min-w-0 border-t border-[var(--nb-rule)] pt-6">
          <NoteReader note={note} />

          <div className="mt-8 border-t pt-6">
            <NoteContentEditor
              note={note}
              workspaceDomain={active.domain}
            />
          </div>
        </div>

        {/* ── Properties rail ─────────────────────────────────── */}
        {/*
          A vertical rule separates the rail from the reading column on wide
          screens rather than a card edge — the flat equivalent of the two
          boxed panels this replaced. Below `lg` the rail stacks under the
          note, where the rule would read as an orphan, so it drops out.
        */}
        <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start lg:border-l lg:border-[var(--nb-rule)] lg:pl-6">
          <div className="border-t border-[var(--nb-rule)] pt-5">
            <NoteMetaPanel
              note={note}
              noteTypes={noteTypes}
              workspaceDomain={active.domain}
            />
          </div>

          <div className="border-t border-[var(--nb-rule)] pt-5">
            <NoteAttachments attachments={attachments} />
            <NoteRelations relations={note.relations} />
          </div>
        </aside>
      </div>
    </div>
  );
}
