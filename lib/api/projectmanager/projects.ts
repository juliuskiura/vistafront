import { serverFetch, serverMutate } from "../server-fetch";
import { toQueryString } from "../query-string";
import type {
  CreateProjectBody,
  Paginated,
  Project,
  ProjectSummary,
  UpdateProjectBody,
} from "../types";
import { unwrap } from "./shared";

/**
 * The project endpoints.
 *
 * All projectmanager endpoints are tenant-scoped. The active workspace
 * slug is forwarded as the ``X-Workspace`` header on every call — without
 * it Django's middleware falls back to the shared `app` workspace and
 * answers `200 OK` with an empty list.
 */

/**
 * List projects in the active workspace.
 *
 * ## Why this takes no filters
 *
 * `ProjectViewSet.get_base_queryset` returns a bare `Project.objects.all()`
 * — the endpoint applies **no** `?search=`, `?status=`, `?priority=` or
 * `?company=` filtering (unlike the CRM's `CompanyViewSet`, which does).
 * Sending those params anyway is worse than useless: the response looks
 * filtered but is not, which is how the previous version of this client
 * ended up filtering one page of 25 projects in memory and hiding
 * everything past it.
 */
export async function listProjects(
  opts: { page?: number; page_size?: number; workspace: string },
): Promise<ProjectSummary[]> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<ProjectSummary[] | Paginated<ProjectSummary>>(
    `/apis/projectmanager/projects/${toQueryString(rest)}`,
    { workspace },
  );
  return unwrap(payload);
}

/**
 * The raw paginated envelope for the project list.
 *
 * The backend caps a page at 100 rows, so a workspace with more projects
 * than that needs more than one page — the envelope's `count` is what
 * says how many there really are.
 */
export async function paginatedListProjects(opts: {
  page?: number;
  page_size?: number;
  workspace: string;
}): Promise<Paginated<ProjectSummary>> {
  const { workspace, ...rest } = opts;
  const payload = await serverFetch<ProjectSummary[] | Paginated<ProjectSummary>>(
    `/apis/projectmanager/projects/${toQueryString(rest)}`,
    { workspace },
  );

  if (Array.isArray(payload)) {
    return {
      count: payload.length,
      next: null,
      previous: null,
      results: payload,
    };
  }
  return {
    count: payload?.count ?? 0,
    next: payload?.next ?? null,
    previous: payload?.previous ?? null,
    results: payload?.results ?? [],
  };
}

/**
 * Every project in the workspace, paged through in batches of 100.
 *
 * The list endpoint applies no filtering at all, so the search and the
 * status/priority filters have to run over the **whole** set. Fetching a
 * single page and filtering it is what made the old list look empty: a
 * workspace with 40 projects and a 25-row page showed 25 of them, and
 * searching for the 26th found nothing.
 *
 * The walk stops at `max` rows so a very large workspace cannot pull an
 * unbounded number of pages into one render.
 */
export async function listAllProjects(opts: {
  workspace: string;
  max?: number;
}): Promise<{ projects: ProjectSummary[]; total: number; truncated: boolean }> {
  const { workspace, max = 1000 } = opts;
  const pageSize = 100;

  const first = await paginatedListProjects({
    page: 1,
    page_size: pageSize,
    workspace,
  });

  const projects = [...first.results];
  let page = 2;

  while (projects.length < first.count && projects.length < max) {
    const next = await paginatedListProjects({
      page,
      page_size: pageSize,
      workspace,
    });
    if (next.results.length === 0) break;
    projects.push(...next.results);
    page += 1;
  }

  return {
    projects: projects.slice(0, max),
    total: first.count,
    truncated: first.count > max,
  };
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

/** Update a project's fields. */
export async function updateProject(
  nanoid: string,
  body: UpdateProjectBody,
  workspace: string,
): Promise<Project> {
  return serverMutate<Project>(
    `/apis/projectmanager/projects/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

/**
 * Delete a project.
 *
 * The backend cascades: a project's tasks go with it.
 */
export async function deleteProject(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/projectmanager/projects/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/**
 * Mark a project as completed. The backend cascades through tasks; we
 * expose this as a convenience for future UX work.
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
