"use server";

import { revalidatePath } from "next/cache";

import { connectNote, createNote } from "@/lib/api/notebook";
import { ConnectNoteSchema, fieldErrorsFromZod } from "@/lib/schemas";
import { type CrmActionState } from "../action-state";
import { backendMessage } from "../_actions-helpers";

/**
 * Server Actions for the notes tab of a company record.
 *
 * A note lives in the Notebook app; the company record only *links* to it
 * through a `NoteRelation`. Linking is a two-step operation — create the
 * note, then connect it — and both steps have to succeed for the note to
 * show up here.
 */

export async function createLinkedNoteAction(input: {
  workspaceDomain: string;
  companyNanoid: string;
  title: string;
  noteType: string;
  body?: string;
  relatableNanoid: string;
}): Promise<CrmActionState> {
  const parsed = ConnectNoteSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    note: "placeholder",
    relatable_nanoid: input.relatableNanoid,
    object_nanoid: input.companyNanoid,
  });
  if (!parsed.success) {
    return { status: "error", message: "Could not link the note." };
  }

  const title = input.title.trim();
  if (!title) {
    return { status: "error", message: "Give the note a title." };
  }

  let noteNanoid: string;
  try {
    const note = await createNote(
      {
        title,
        note_type: input.noteType,
        ...(input.body ? { content: { text: input.body } } : {}),
      } as Parameters<typeof createNote>[0],
      input.workspaceDomain,
    );
    noteNanoid = note.nanoid;
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(error, "Could not create the note."),
    };
  }

  try {
    await connectNote(
      noteNanoid,
      {
        relatable_nanoid: input.relatableNanoid,
        object_nanoid: input.companyNanoid,
      },
      input.workspaceDomain,
    );
  } catch (error) {
    return {
      status: "error",
      message: backendMessage(
        error,
        "The note was created but could not be linked to this company.",
      ),
    };
  }

  revalidatePath(
    `/[workspace]/dashboard/companies/${input.companyNanoid}`,
    "page",
  );
  revalidatePath("/[workspace]/dashboard/notebook", "page");
  return { status: "success", message: "Note added." };
}
