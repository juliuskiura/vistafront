"use server";

import { revalidatePath } from "next/cache";

import {
  mergeTasks,
  suggestTaskMerge,
} from "@/lib/api";
import {
  MergeTasksSchema,
  fieldErrorsFromZod,
} from "@/lib/schemas";
import { type ProjectResultState } from "../action-state";
import { backendMessage } from "../_actions-helpers";

/**
 * Server Actions for merging.
 *
 * A merge is **destructive**: the backend creates one new record and
 * deletes the ones that went into it (moving their tasks across). The
 * merge dialog lists the records and confirms before anything is sent.
 */

/**
 * Server Action: merge the selected tasks into one.
 *
 * The payload is a plain object rather than a `FormData`: the merge is
 * driven by a list the user ticked, not by a form they filled in, and the
 * dialog is interactive by nature.
 */
export async function mergeTasksAction(input: {
  workspaceDomain: string;
  taskIds: string[];
  title: string;
  description?: string;
}): Promise<ProjectResultState> {
  const parsed = MergeTasksSchema.safeParse({
    workspace_domain: input.workspaceDomain,
    task_ids: input.taskIds,
    title: input.title,
    description: input.description ?? "",
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Those tasks cannot be merged.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const data = parsed.data;

  try {
    await mergeTasks(
      data.task_ids,
      data.title,
      data.description ?? "",
      data.workspace_domain,
    );
  } catch (error) {
    console.error("mergeTasksAction failed:", error);
    return {
      status: "error",
      message: backendMessage(
        error,
        "We could not merge the tasks. They may belong to different projects.",
      ),
    };
  }

  revalidatePath(`/${data.workspace_domain}/dashboard/projects`);
  return { status: "success" };
}

/**
 * Server Action: ask the AI service for a merged title and description.
 *
 * The backend answers `502` when no AI model is configured, so the failure
 * is returned as a message the dialog can show — the merge itself never
 * depends on the suggestion.
 */
export async function suggestMergeAction(input: {
  workspaceDomain: string;
  ids: string[];
}): Promise<{ title?: string; description?: string; error?: string }> {
  if (!input.workspaceDomain || input.ids.length < 2) {
    return { error: "Select at least two records first." };
  }

  try {
    const suggestion = await suggestTaskMerge(input.ids, input.workspaceDomain);

    if (!suggestion?.title) {
      return {
        error: "AI suggestion failed. Check your AI model configuration.",
      };
    }
    return {
      title: suggestion.title,
      description: suggestion.description ?? "",
    };
  } catch (error) {
    console.error("suggestMergeAction failed:", error);
    return {
      error: "AI suggestion failed. Check your AI model configuration.",
    };
  }
}
