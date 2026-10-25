import { serverFetch, serverMutate } from "../server-fetch";
import { toQueryString } from "../query-string";
import type {
  CreateTaskBody,
  MergeSuggestion,
  Paginated,
  Task,
  UpdateTaskBody,
} from "../types";
import { unwrap } from "./shared";

/**
 * The task endpoints.
 *
 * A task belongs to a project directly via its `project` FK, so
 * `?project=` filters on `project__nanoid`.
 */

export async function listTasks(
  opts: { project?: string; workspace: string },
): Promise<Task[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<Task[] | Paginated<Task>>(
    `/apis/projectmanager/tasks/${toQueryString(rest)}`,
    { workspace },
  );
  return unwrap(payload);
}

export function getTask(
  nanoid: string,
  workspace: string,
): Promise<Task> {
  return serverFetch<Task>(
    `/apis/projectmanager/tasks/${nanoid}/`,
    { workspace },
  );
}

export async function createTask(
  body: CreateTaskBody,
  workspace: string,
): Promise<Task> {
  return serverMutate<Task>("/apis/projectmanager/tasks/", {
    body,
    method: "POST",
    workspace,
  });
}

export async function updateTask(
  nanoid: string,
  body: UpdateTaskBody,
  workspace: string,
): Promise<Task> {
  return serverMutate<Task>(`/apis/projectmanager/tasks/${nanoid}/`, {
    body,
    method: "PATCH",
    workspace,
  });
}

export async function deleteTask(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/projectmanager/tasks/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/**
 * Mark a task as done.
 *
 * The backend has **no** `complete` action on the task viewset — only on
 * projects — so completion is a plain status PATCH.
 */
export async function completeTask(
  nanoid: string,
  workspace: string,
): Promise<Task> {
  return serverMutate<Task>(`/apis/projectmanager/tasks/${nanoid}/`, {
    body: { status: "done" },
    method: "PATCH",
    workspace,
  });
}

/**
 * Ask the AI service for a merged title and description for a set of tasks.
 *
 * Answers `502` when no AI model is configured, so callers must handle the
 * failure and fall back to a manual title.
 */
export async function suggestTaskMerge(
  taskIds: string[],
  workspace: string,
): Promise<MergeSuggestion> {
  return serverMutate<MergeSuggestion>(
    "/apis/projectmanager/tasks/suggest_merge/",
    { body: { task_ids: taskIds }, method: "POST", workspace },
  );
}

/**
 * Merge tasks into one. **The source tasks are deleted.**
 */
export async function mergeTasks(
  taskIds: string[],
  title: string,
  description: string,
  workspace: string,
): Promise<Task> {
  return serverMutate<Task>("/apis/projectmanager/tasks/merge/", {
    body: { task_ids: taskIds, title, description },
    method: "POST",
    workspace,
  });
}
