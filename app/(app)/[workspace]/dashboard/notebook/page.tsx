import { listNotes, listNoteTypes, type Note, type NoteTypeOption } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { NotebookListView } from "@/app/(app)/[workspace]/dashboard/notebook/notebook-list-view";

/**
 * Notebook list (Server Component).
 *
 * Pulls the active workspace, the full notes list (with the user's filters
 * from `searchParams`), and the workspace-configurable note types. The list
 * itself is rendered as a Server Component for the table; the "New Note"
 * composer + "New Type" dialog live in a Client Component island because
 * they need `useActionState`.
 */
export default async function NotebookListPage({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{
    search?: string;
    note_type?: string;
    archived?: string;
  }>;
}) {
  const { workspace: slug } = await params;
  const { search, note_type, archived } = await searchParams;
  const active = await requireWorkspace(slug);

  const showArchived = archived === "true";

  const [notes, noteTypes] = await Promise.all([
    listNotes({
      search: search?.trim() || undefined,
      note_type: note_type?.trim() || undefined,
      archived: showArchived || undefined,
      ordering: "-updated_at",
      workspace: active.domain,
    }).catch(() => [] as Note[]),
    listNoteTypes(active.domain).catch(() => [] as NoteTypeOption[]),
  ]);

  return (
    <NotebookListView
      workspaceDomain={active.domain}
      workspaceNanoid={active.nanoid}
      workspaceName={active.name}
      notes={notes}
      noteTypes={noteTypes}
      initialSearch={search ?? ""}
      initialType={note_type ?? ""}
      showArchived={showArchived}
    />
  );
}