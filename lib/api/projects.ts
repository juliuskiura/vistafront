import { serverFetch, serverMutate } from "./server-fetch";
import { toQueryString } from "./query-string";
import type {
  CreateProjectBody,
  Deliverable,
  DeliverableSummary,
  Paginated,
  Project,
  ProjectSummary,
  Task,
} from "./types";

/**
 * Every list endpoint in this Django app is globally paginated
 * (``LivechatPagination``, page size 25), so responses come back as
 * ``{ count, next, previous, results }`` instead of a plain array. Unwrap the
 * ``results`` page defensively: raw arrays pass through, non-array error
 * payloads degrade to an empty list instead of crashing callers.
 */
function unwrap<T>(payload: T[] | Paginated<T>): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray((payload as Paginated<T>).results)) {
    return (payload as Paginated<T>).results;
  }
  return [];
}

/* ──────────────────────────────────────────────────────────────────────
 * Projects
 *
 * All projectmanager endpoints are tenant-scoped. The active workspace
 * slug is forwarded as the ``X-Workspace`` header on every call.
 * ────────────────────────────────────────────────────────────────────── */

interface ProjectOpts {
  search?: string;
  status?: string;
  priority?: string;
  company?: string;
}

/**
 * List projects in the active workspace. The detail payload (`Project`)
 * is returned for the single-item endpoints; the list endpoint uses a
 * slimmer `ProjectSummary` serializer on the backend.
 */
export async function listProjects(
  opts: ProjectOpts & { workspace: string },
): Promise<ProjectSummary[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<ProjectSummary[] | Paginated<ProjectSummary>>(
    `/apis/projectmanager/projects/${toQueryString(rest)}`,
    { workspace },
  );
  return unwrap(payload);
}

/**
 * Fetch a single project by nanoid. Returns the full `Project` (with
 * description, dates, etc.).
 */
export function getProject(
  nanoid: string,
  workspace: string,
): Promise<Project> {
  return serverFetch<Project>(
    `/apis/projectmanager/projects/${nanoid}/`,
    { workspace },
  );
}

/**
 * Create a project. The `company` field is the company nanoid (required);
 * `client` is an optional contact nanoid. Returns the new project's
 * nanoid via the full `Project` serializer.
 */
export async function createProject(
  body: CreateProjectBody,
  workspace: string,
): Promise<Project> {
  return serverMutate<Project>("/apis/projectmanager/projects/", {
    body,
    method: "POST",
    workspace,
  });
}

/**
 * Mark a project as completed. The backend cascades through deliverables
 * and tasks; we expose this as a convenience for future UX work.
 */
export async function completeProject(
  nanoid: string,
  workspace: string,
): Promise<Project> {
  return serverMutate<Project>(
    `/apis/projectmanager/projects/${nanoid}/complete/`,
    { body: {}, method: "PATCH", workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Tasks
 * ────────────────────────────────────────────────────────────────────── */

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

/* ──────────────────────────────────────────────────────────────────────
 * Deliverables
 * ────────────────────────────────────────────────────────────────────── */

export async function listDeliverables(
  opts: { project?: string; type?: string; workspace: string },
): Promise<DeliverableSummary[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<
    DeliverableSummary[] | Paginated<DeliverableSummary>
  >(`/apis/projectmanager/deliverables/${toQueryString(rest)}`, { workspace });
  return unwrap(payload);
}

export function getDeliverable(
  nanoid: string,
  workspace: string,
): Promise<Deliverable> {
  return serverFetch<Deliverable>(
    `/apis/projectmanager/deliverables/${nanoid}/`,
    { workspace },
  );
}