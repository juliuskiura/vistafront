import Link from "next/link";

import {
  getNote,
  listNoteAttachments,
  listNoteTypes,
  type NoteAttachment,
  type NoteTypeOption,
} from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { NoteDetailView } from "@/app/(app)/[workspace]/dashboard/notebook/[id]/note-detail-view";

/**
 * Note detail (Server Component).
 *
 * Fetches the note, its attachments, and the workspace's note-type catalogue
 * on the server. The interactive bits — meta edit, content edit, delete —
 * are delegated to a Client Component island that posts Server Actions.
 */
export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ workspace: string; id: string }>;
}) {
  const { workspace: slug, id } = await params;
  const active = await requireWorkspace(slug);
  const note = await getNote(id, active.domain).catch(() => null);

  if (!note) {
    return (
      <div className="max-w-3xl">
        <Link
          href={`/${active.domain}/dashboard/notebook`}
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Notes
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Note not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The note you're looking for may have been deleted.
        </p>
      </div>
    );
  }

  const [attachments, noteTypes] = await Promise.all([
    listNoteAttachments(note.nanoid, active.domain).catch(
      () => [] as NoteAttachment[],
    ),
    listNoteTypes(active.domain).catch(() => [] as NoteTypeOption[]),
  ]);

  return (
    <NoteDetailView
      workspaceDomain={active.domain}
      workspaceName={active.name}
      note={note}
      attachments={attachments}
      noteTypes={noteTypes}
    />
  );
}