import type { Note, NoteTypeOption } from "@/lib/api";
import { cn } from "@/lib/utils";

import { NoteCard } from "./note-card";
import type { NoteView } from "../action-state";

interface NoteGridProps {
  notes: Note[];
  noteTypes: NoteTypeOption[];
  workspaceDomain: string;
  view: NoteView;
}

/**
 * Lays the notes out as a card grid or a dense row list.
 *
 * A Server Component — the grid and the cards are static markup, so this
 * costs nothing on the client beyond the per-card actions island.
 *
 * Grid: 3-up at `xl`, 2-up at `lg`, 1-up below. Rows: a single column of
 * short horizontal entries.
 */
export function NoteGrid({
  notes,
  noteTypes,
  workspaceDomain,
  view,
}: NoteGridProps) {
  // Lookup by type key once rather than per card — `find` inside the map
  // would be O(n × m) on every render.
  const typesByKey = new Map(noteTypes.map((t) => [String(t.key), t]));

  return (
    <div
      className={cn(
        view === "grid"
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
          : "flex flex-col gap-2",
      )}
    >
      {notes.map((note, index) => (
        <NoteCard
          key={note.nanoid}
          note={note}
          type={typesByKey.get(String(note.note_type)) ?? null}
          workspaceDomain={workspaceDomain}
          view={view}
          index={index}
        />
      ))}
    </div>
  );
}
