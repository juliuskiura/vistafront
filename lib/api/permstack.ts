import { serverFetch, serverMutate } from "./server-fetch";
import type {
  PermissionAction,
  PermissionActionList,
  PermissionMaskResolution,
} from "./types";

/**
 * The catalog of actions (view / list / create / change / delete / export)
 * with their bit values and display labels. These are the columns of the
 * permission matrix.
 *
 * Backed by `/apis/permstack/actions/`. Not tenant-scoped — the catalog is
 * static platform metadata, so no ``X-Workspace`` header is sent.
 */
export async function listPermissionActions(): Promise<PermissionAction[]> {
  const data = await serverFetch<PermissionActionList>("/apis/permstack/actions/");
  return data.actions;
}

/**
 * Translate one or more permission bitmasks into action names and display
 * labels. Backed by `POST /apis/permstack/masks/resolve/`.
 *
 * Not tenant-scoped — no ``X-Workspace`` header is sent.
 */
export async function resolvePermissionMasks(
  masks: number[],
): Promise<PermissionMaskResolution[]> {
  const data = await serverMutate<{ results: PermissionMaskResolution[] }>(
    "/apis/permstack/masks/resolve/",
    { body: { masks }, method: "POST" },
  );
  return data.results;
}
