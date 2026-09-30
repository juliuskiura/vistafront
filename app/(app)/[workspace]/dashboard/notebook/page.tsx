import { Banner } from "@/components/banner";
import { paginatedListNotes } from "@/lib/api/notebook";
import { listNoteTypes, type Note, type NoteTypeOption, type Paginated } from "@/lib/api";
import { requireWorkspace } from "@/lib/auth/server";
import { requireFeature } from "@/lib/features/guard";

import {
  parseNoteOrdering,
  parseNotePage,
  parseNotePageSize,
  parseNoteView,
} from "./action-state";
import { NoteComposer } from "./_components/note-composer";
import { NoteGrid } from "./_components/note-grid";
import { NotebookEmptyState } from "./_components/notebook-empty-state";
import { NotebookFilterBar } from "./_components/notebook-filter-bar";
import { NotebookPagination } from "./_components/notebook-pagination";

/**
 * Notebook list (Server Component).
 *
 * Owns every piece of state that shapes the page — search, type, archived,
 * ordering, page, page size, and the grid/rows view mode — reading it all
 * from the URL so a view is linkable and survives a reload.
 *
 * Pagination is resolved here, not in the browser: `page` goes to the API so
 * Django returns the right slice, and `totalPages` comes from the envelope's
 * `count`. This replaced a call to `listNotes`, which unwraps to `Note[]` and
 * throws the count away — so the old header reported `results.length`, which
 * is the page size, as the workspace's total note count.
 *
 * The only client boundaries below are the filter bar, the pagination
 * footer, the composer, and the per-card actions island.
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
    page?: string;
    page_size?: string;
    ordering?: string;
    view?: string;
  }>;
}) {
  const { workspace: slug } = await params;
  const sp = await searchParams;
  const active = await requireWorkspace(slug);
  await requireFeature(active, "notebook.notes");

  const search = sp.search?.trim() || undefined;
  const noteType = sp.note_type?.trim() || undefined;
  const archived = sp.archived === "true";
  const page = parseNotePage(sp.page);
  const pageSize = parseNotePageSize(sp.page_size);
  const ordering = parseNoteOrdering(sp.ordering);
  const view = parseNoteView(sp.view);

  const [payload, noteTypes] = await Promise.all([
    paginatedListNotes({
      search,
      note_type: noteType,
      archived: archived || undefined,
      ordering,
      page,
      page_size: pageSize,
      workspace: active.domain,
    }).catch(
      () =>
        ({
          count: 0,
          next: null,
          previous: null,
          results: [],
        }) as Paginated<Note>,
    ),
    listNoteTypes(active.domain).catch(() => [] as NoteTypeOption[]),
  ]);

  const notes = payload.results ?? [];
  const totalCount = payload.count ?? notes.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // A pasted `?page=99` would otherwise render an empty grid with no
  // explanation; clamp to the last real page so the next render settles.
  const safePage = Math.min(page, totalPages);

  const typeByKey = new Map(noteTypes.map((t) => [String(t.key), t]));
  const activeType = noteType ? typeByKey.get(noteType) : null;

  // Distinguish "this workspace has no notes" from "your filter matched
  // nothing" — they need different next steps.
  const emptyReason = search || noteType
    ? "no-results"
    : archived
      ? "no-archived"
      : "no-notes";

  const basePath = `/${active.domain}/dashboard/notebook`;

  return (
    <div className="flex min-h-full flex-col">
      <Banner
        title="Notebook"
        description={`Meeting notes, ideas, and SOPs for ${active.name}. Each note type carries its own colour, so categories stay recognisable at a glance.`}
        actions={[
          {
            label: "New note",
            node: (
              <NoteComposer
                workspaceDomain={active.domain}
                noteTypes={noteTypes}
                placement="banner"
              />
            ),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-5 pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{totalCount}</span>{" "}
            {totalCount === 1 ? "note" : "notes"}
            {activeType ? ` in ${activeType.name}` : ""}
            {archived ? " · archived" : ""}
          </p>
        </div>

        <NotebookFilterBar noteTypes={noteTypes} totalCount={totalCount} />

        {notes.length === 0 ? (
          <NotebookEmptyState
            reason={emptyReason}
            search={search ?? ""}
            noteTypeName={activeType?.name}
            clearHref={basePath}
          />
        ) : (
          <>
            <NoteGrid
              notes={notes}
              noteTypes={noteTypes}
              workspaceDomain={active.domain}
              view={view}
            />
            <NotebookPagination
              page={safePage}
              pageSize={pageSize}
              totalCount={totalCount}
              totalPages={totalPages}
              hasNext={Boolean(payload.next) || safePage < totalPages}
              hasPrevious={Boolean(payload.previous) || safePage > 1}
            />
          </>
        )}
      </div>
    </div>
  );
}
