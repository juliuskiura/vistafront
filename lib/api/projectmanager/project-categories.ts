import { serverFetch, serverMutate } from "../server-fetch";
import { toQueryString } from "../query-string";
import type {
  CreateProjectCategoryBody,
  Paginated,
  ProjectCategory,
  UpdateProjectCategoryBody,
} from "../types";
import { unwrap } from "./shared";

/**
 * The project-category endpoints.
 *
 * A category classifies a project within a workspace. Endpoints are
 * tenant-scoped; the active workspace slug is forwarded as the
 * ``X-Workspace`` header on every call.
 */

export async function listProjectCategories(
  workspace: string,
): Promise<ProjectCategory[]> {
  const payload = await serverFetch<ProjectCategory[] | Paginated<ProjectCategory>>(
    `/apis/projectmanager/project-categories/${toQueryString()}`,
    { workspace },
  );
  return unwrap(payload);
}

export function getProjectCategory(
  nanoid: string,
  workspace: string,
): Promise<ProjectCategory> {
  return serverFetch<ProjectCategory>(
    `/apis/projectmanager/project-categories/${nanoid}/`,
    { workspace },
  );
}

export async function createProjectCategory(
  body: CreateProjectCategoryBody,
  workspace: string,
): Promise<ProjectCategory> {
  return serverMutate<ProjectCategory>("/apis/projectmanager/project-categories/", {
    body,
    method: "POST",
    workspace,
  });
}

export async function updateProjectCategory(
  nanoid: string,
  body: UpdateProjectCategoryBody,
  workspace: string,
): Promise<ProjectCategory> {
  return serverMutate<ProjectCategory>(
    `/apis/projectmanager/project-categories/${nanoid}/`,
    { body, method: "PATCH", workspace },
  );
}

export async function deleteProjectCategory(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(`/apis/projectmanager/project-categories/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}
