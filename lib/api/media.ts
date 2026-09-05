import { serverFetch, serverMutate } from "./server-fetch";
import { toQueryString } from "./query-string";
import type {
  Asset,
  AssetMeta,
  AssetPermission,
  AssetShare,
  AssetTransformSpec,
  AssetUsageResponse,
  AssetVersion,
  Collection,
  Folder,
  GeneratedAsset,
  MediaStats,
  PaginatedAssets,
  PlatformPresetsResponse,
  SearchFilters,
  SmartCollection,
  TransformationPreset,
  UploadConfig,
} from "./types";

function wsOpts(workspace: string) {
  return { workspace };
}

/* ──────────────────────────────────────────────────────────────────────
 * Stats
 * ────────────────────────────────────────────────────────────────────── */

export async function getMediaStats(
  workspace: string,
): Promise<MediaStats> {
  return serverFetch<MediaStats>("/apis/media/assets/stats/", wsOpts(workspace));
}

/* ──────────────────────────────────────────────────────────────────────
 * Assets
 * ────────────────────────────────────────────────────────────────────── */

export async function getAssets(
  opts: {
    params?: Partial<SearchFilters>;
    page?: number;
    page_size?: number;
    workspace: string;
  },
): Promise<PaginatedAssets> {
  const { workspace, params = {}, page = 1, page_size = 24 } = opts;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("page_size", String(page_size));
  if ((params as SearchFilters).text) searchParams.set("text", String((params as SearchFilters).text));
  if ((params as SearchFilters).asset_type) searchParams.set("asset_type", String((params as SearchFilters).asset_type));
  if ((params as SearchFilters).tags?.length) searchParams.set("tags", (params as SearchFilters).tags!.join(","));
  if ((params as SearchFilters).folder) searchParams.set("folder", String((params as SearchFilters).folder));
  if ((params as SearchFilters).collection) searchParams.set("collection", String((params as SearchFilters).collection));
  if ((params as SearchFilters).date_from) searchParams.set("date_from", String((params as SearchFilters).date_from));
  if ((params as SearchFilters).date_to) searchParams.set("date_to", String((params as SearchFilters).date_to));
  if ((params as SearchFilters).uploader) searchParams.set("uploader", String((params as SearchFilters).uploader));
  if ((params as SearchFilters).dominant_color) searchParams.set("dominant_color", String((params as SearchFilters).dominant_color));
  const fav = (params as SearchFilters).favorite;
  if (fav !== null && fav !== undefined) searchParams.set("favorite", String(fav));
  const arch = (params as SearchFilters).archived;
  if (arch !== null && arch !== undefined) searchParams.set("archived", String(arch));
  if ((params as SearchFilters).width) searchParams.set("width", String((params as SearchFilters).width));
  if ((params as SearchFilters).height) searchParams.set("height", String((params as SearchFilters).height));
  if ((params as SearchFilters).orientation) searchParams.set("orientation", String((params as SearchFilters).orientation));

  return serverFetch<PaginatedAssets>(
    `/apis/media/assets/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    wsOpts(workspace),
  );
}

export async function getTrashedAssets(
  opts: { page?: number; page_size?: number; workspace: string },
): Promise<Asset[]> {
  const { workspace, page = 1, page_size = 24 } = opts;
  const searchParams = new URLSearchParams();
  if (page) searchParams.set("page", String(page));
  if (page_size) searchParams.set("page_size", String(page_size));
  const qs = searchParams.toString();

  const resp = await serverFetch<
    | PaginatedAssets
    | Asset[]
  >(`/apis/media/assets/trash/${qs ? `?${qs}` : ""}`, wsOpts(workspace));

  if (Array.isArray(resp)) return resp;
  return resp.results ?? [];
}

export async function getAsset(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  return serverFetch<Asset>(`/apis/media/assets/${nanoid}/`, wsOpts(workspace));
}

export async function createAsset(
  form: FormData,
  workspace: string,
): Promise<Asset> {
  const cookieStore = await (await import("next/headers")).cookies();
  const accessToken = cookieStore.get("access");
  const refreshToken = cookieStore.get("refresh");
  const csrfToken = cookieStore.get("csrftoken");

  const headers: HeadersInit = {};
  const cookieHeader = [
    accessToken ? `access=${accessToken.value}` : null,
    refreshToken ? `refresh=${refreshToken.value}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken.value;
  }
  if (workspace) {
    headers["X-Workspace"] = workspace;
  }

  const response = await fetch(
    `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/apis/media/assets/`,
    {
      method: "POST",
      headers,
      body: form,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create asset: ${response.status} ${errorText}`);
  }

  return response.json();
}

export async function updateAsset(
  nanoid: string,
  data: Partial<Asset>,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/`, {
    body: data,
    method: "PATCH",
    workspace,
  });
}

export async function deleteAsset(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/media/assets/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

export async function trashAsset(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/trash/`, {
    body: {},
    method: "POST",
    workspace,
  });
}

export async function restoreAsset(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/restore/`, {
    body: {},
    method: "POST",
    workspace,
  });
}

export async function archiveAsset(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/archive/`, {
    body: {},
    method: "POST",
    workspace,
  });
}

export async function favoriteAsset(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/favorite/`, {
    body: {},
    method: "POST",
    workspace,
  });
}

export async function pinAsset(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/pin/`, {
    body: {},
    method: "POST",
    workspace,
  });
}

export async function getAssetVersions(
  nanoid: string,
  workspace: string,
): Promise<AssetVersion[]> {
  return serverFetch<AssetVersion[]>(
    `/apis/media/assets/${nanoid}/versions/`,
    wsOpts(workspace),
  );
}

export async function transformAsset(
  nanoid: string,
  spec: AssetTransformSpec,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/transform/`, {
    body: spec,
    method: "POST",
    workspace,
  });
}

export async function updateAssetMetadata(
  nanoid: string,
  metadata: Record<string, any>,
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>(`/apis/media/assets/${nanoid}/metadata/`, {
    body: metadata,
    method: "PATCH",
    workspace,
  });
}

export async function patchAssetMultipart(
  nanoid: string,
  data: FormData,
  workspace: string,
): Promise<Asset> {
  const cookieStore = await (await import("next/headers")).cookies();
  const accessToken = cookieStore.get("access");
  const refreshToken = cookieStore.get("refresh");
  const csrfToken = cookieStore.get("csrftoken");

  const headers: HeadersInit = {};
  const cookieHeader = [
    accessToken ? `access=${accessToken.value}` : null,
    refreshToken ? `refresh=${refreshToken.value}` : null,
  ]
    .filter(Boolean)
    .join("; ");

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  if (csrfToken) {
    headers["X-CSRFToken"] = csrfToken.value;
  }
  if (workspace) {
    headers["X-Workspace"] = workspace;
  }

  const response = await fetch(
    `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}/apis/media/assets/${nanoid}/`,
    {
      method: "PATCH",
      headers,
      body: data,
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to patch asset: ${response.status} ${errorText}`,
    );
  }

  return response.json();
}

/* ──────────────────────────────────────────────────────────────────────
 * Bulk operations
 * ────────────────────────────────────────────────────────────────────── */

export async function bulkDeleteAssets(
  nanoids: string[],
  workspace: string,
): Promise<{ deleted: number }> {
  return serverMutate<{ deleted: number }>(
    "/apis/media/assets/bulk_delete/",
    { body: { nanoids }, workspace },
  );
}

export async function bulkPurgeAssets(
  nanoids: string[],
  workspace: string,
): Promise<{ deleted: number }> {
  return serverMutate<{ deleted: number }>(
    "/apis/media/assets/bulk_purge/",
    { body: { nanoids }, workspace },
  );
}

export async function bulkMoveAssets(
  nanoids: string[],
  folder_nanoid: string | null,
  workspace: string,
): Promise<{ moved: number }> {
  return serverMutate<{ moved: number }>("/apis/media/assets/bulk_move/", {
    body: { nanoids, folder_nanoid },
    workspace,
  });
}

export async function bulkFavoriteAssets(
  nanoids: string[],
  favorite: boolean,
  workspace: string,
): Promise<{ updated: number }> {
  return serverMutate<{ updated: number }>(
    "/apis/media/assets/bulk_favorite/",
    { body: { nanoids, favorite }, workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Search
 * ────────────────────────────────────────────────────────────────────── */

export async function searchAssets(
  opts: {
    query: string;
    filters?: Partial<SearchFilters>;
    page?: number;
    page_size?: number;
    workspace: string;
  },
): Promise<PaginatedAssets> {
  const { workspace, query, filters = {}, page = 1, page_size = 24 } = opts;
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("page_size", String(page_size));
  searchParams.set("text", query);
  if (filters.asset_type) searchParams.set("asset_type", filters.asset_type);
  if (filters.tags?.length) searchParams.set("tags", filters.tags.join(","));
  if (filters.folder) searchParams.set("folder", filters.folder);
  if (filters.collection) searchParams.set("collection", filters.collection);
  if (filters.date_from) searchParams.set("date_from", filters.date_from);
  if (filters.date_to) searchParams.set("date_to", filters.date_to);
  if (filters.uploader) searchParams.set("uploader", filters.uploader);
  if (filters.dominant_color)
    searchParams.set("dominant_color", filters.dominant_color);
  if (filters.favorite !== null && filters.favorite !== undefined)
    searchParams.set("favorite", String(filters.favorite));
  if (filters.archived !== null && filters.archived !== undefined)
    searchParams.set("archived", String(filters.archived));

  return serverFetch<PaginatedAssets>(
    `/apis/media/search/${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    wsOpts(workspace),
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Folders
 * ────────────────────────────────────────────────────────────────────── */

export async function getFolders(
  opts: { parent?: string | null; workspace: string },
): Promise<Folder[]> {
  const { workspace, parent = null } = opts;
  const qs = parent !== null && parent !== undefined
    ? `?parent=${encodeURIComponent(parent)}`
    : "";
  return serverFetch<Folder[]>(
    `/apis/media/folders/${qs}`,
    wsOpts(workspace),
  );
}

export async function getFolderTree(
  workspace: string,
): Promise<Folder[]> {
  return serverFetch<Folder[]>(
    "/apis/media/folders/tree/",
    wsOpts(workspace),
  );
}

export async function getFolder(
  nanoid: string,
  workspace: string,
): Promise<Folder> {
  return serverFetch<Folder>(`/apis/media/folders/${nanoid}/`, wsOpts(workspace));
}

export async function createFolder(
  body: { name: string; parent?: string | null },
  workspace: string,
): Promise<Folder> {
  return serverMutate<Folder>("/apis/media/folders/", {
    body,
    workspace,
  });
}

export async function updateFolder(
  nanoid: string,
  data: Partial<Folder>,
  workspace: string,
): Promise<Folder> {
  return serverMutate<Folder>(`/apis/media/folders/${nanoid}/`, {
    body: data,
    method: "PATCH",
    workspace,
  });
}

export async function deleteFolder(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/media/folders/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

export async function moveFolder(
  nanoid: string,
  parent: string | null,
  workspace: string,
): Promise<Folder> {
  return serverMutate<Folder>(`/apis/media/folders/${nanoid}/move/`, {
    body: { parent },
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Collections
 * ────────────────────────────────────────────────────────────────────── */

export async function getCollections(
  workspace: string,
): Promise<Collection[]> {
  return serverFetch<Collection[]>(
    "/apis/media/collections/",
    wsOpts(workspace),
  );
}

export async function getCollection(
  nanoid: string,
  workspace: string,
): Promise<Collection & { assets: Asset[] }> {
  return serverFetch<Collection & { assets: Asset[] }>(
    `/apis/media/collections/${nanoid}/`,
    wsOpts(workspace),
  );
}

export async function createCollection(
  body: { name: string; shareable?: boolean },
  workspace: string,
): Promise<Collection> {
  return serverMutate<Collection>("/apis/media/collections/", {
    body,
    workspace,
  });
}

export async function updateCollection(
  nanoid: string,
  data: Partial<Collection>,
  workspace: string,
): Promise<Collection> {
  return serverMutate<Collection>(`/apis/media/collections/${nanoid}/`, {
    body: data,
    method: "PATCH",
    workspace,
  });
}

export async function deleteCollection(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/media/collections/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

export async function addAssetToCollection(
  collection_nanoid: string,
  asset_nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>("/apis/media/asset-collections/", {
    body: { collection: collection_nanoid, asset: asset_nanoid },
    workspace,
  });
}

export async function removeAssetFromCollection(
  assetCollectionLinkNanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(
    `/apis/media/asset-collections/${assetCollectionLinkNanoid}/`,
    { body: {}, method: "DELETE", workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Smart Collections
 * ────────────────────────────────────────────────────────────────────── */

export async function getSmartCollections(
  workspace: string,
): Promise<SmartCollection[]> {
  return serverFetch<SmartCollection[]>(
    "/apis/media/smart-collections/",
    wsOpts(workspace),
  );
}

export async function createSmartCollection(
  body: { name: string; filter_spec: Record<string, any> },
  workspace: string,
): Promise<SmartCollection> {
  return serverMutate<SmartCollection>("/apis/media/smart-collections/", {
    body,
    workspace,
  });
}

export async function deleteSmartCollection(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/media/smart-collections/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Asset-Folder links
 * ────────────────────────────────────────────────────────────────────── */

export async function addAssetToFolder(
  asset_nanoid: string,
  folder_nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>("/apis/media/asset-folders/", {
    body: { asset: asset_nanoid, folder: folder_nanoid },
    workspace,
  });
}

export async function removeAssetFromFolder(
  assetFolderLinkNanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(
    `/apis/media/asset-folders/${assetFolderLinkNanoid}/`,
    { body: {}, method: "DELETE", workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Asset metadata
 * ────────────────────────────────────────────────────────────────────── */

export async function getAssetMetas(
  assetNanoid: string,
  workspace: string,
): Promise<AssetMeta[]> {
  return serverFetch<AssetMeta[]>(
    `/apis/media/asset-meta/?asset=${assetNanoid}`,
    wsOpts(workspace),
  );
}

export async function createAssetMeta(
  body: { asset: string; key: string; value: string },
  workspace: string,
): Promise<AssetMeta> {
  return serverMutate<AssetMeta>("/apis/media/asset-meta/", {
    body,
    workspace,
  });
}

export async function updateAssetMeta(
  nanoid: string,
  asset: string,
  data: Partial<AssetMeta>,
  workspace: string,
): Promise<AssetMeta> {
  return serverMutate<AssetMeta>(`/apis/media/asset-meta/${nanoid}/`, {
    body: data,
    method: "PATCH",
    workspace,
  });
}

export async function deleteAssetMeta(
  nanoid: string,
  asset: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/media/asset-meta/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Asset permissions
 * ────────────────────────────────────────────────────────────────────── */

export async function getAssetPermissions(
  assetNanoid: string,
  workspace: string,
): Promise<AssetPermission[]> {
  return serverFetch<AssetPermission[]>(
    `/apis/media/asset-permissions/?asset=${assetNanoid}`,
    wsOpts(workspace),
  );
}

export async function createAssetPermission(
  body: Partial<AssetPermission>,
  workspace: string,
): Promise<AssetPermission> {
  return serverMutate<AssetPermission>("/apis/media/asset-permissions/", {
    body,
    workspace,
  });
}

export async function updateAssetPermission(
  nanoid: string,
  data: Partial<AssetPermission>,
  workspace: string,
): Promise<AssetPermission> {
  return serverMutate<AssetPermission>(
    `/apis/media/asset-permissions/${nanoid}/`,
    { body: data, method: "PATCH", workspace },
  );
}

export async function deleteAssetPermission(
  nanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(`/apis/media/asset-permissions/${nanoid}/`, {
    body: {},
    method: "DELETE",
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Direct-to-OCI presigned upload
 * ────────────────────────────────────────────────────────────────────── */

export async function presignUpload(
  body: { filename: string; mime_type?: string; size?: number },
  workspace: string,
): Promise<{ upload_url: string; key: string; nanoid: string; expires_in: number }> {
  return serverMutate<
    { upload_url: string; key: string; nanoid: string; expires_in: number }
  >("/apis/media/assets/presign/", {
    body,
    workspace,
  });
}

export async function confirmUpload(
  body: { key: string; filename: string; mime_type?: string; size?: number },
  workspace: string,
): Promise<Asset> {
  return serverMutate<Asset>("/apis/media/assets/confirm/", {
    body,
    workspace,
  });
}

export async function getUploadConfig(
  workspace: string,
): Promise<UploadConfig> {
  return serverFetch<UploadConfig>(
    "/apis/media/assets/config/",
    wsOpts(workspace),
  );
}

export async function initiateUpload(
  body: { file_name: string; file_size: number; content_type?: string },
  workspace: string,
): Promise<{ nanoid: string }> {
  return serverMutate<{ nanoid: string }>(
    "/apis/media/assets/uploads/initiate/",
    { body, workspace },
  );
}

export async function getSessionParts(
  sessionId: string,
  workspace: string,
): Promise<{ parts: Array<{ part_number: number }>; part_size: number }> {
  return serverFetch<
    { parts: Array<{ part_number: number }>; part_size: number }
  >(`/apis/media/assets/uploads/${sessionId}/parts/`, wsOpts(workspace));
}

export async function commitSession(
  body: {
    sessionId: string;
    parts: Array<{ part_number: number; etag: string }>;
  },
  workspace: string,
): Promise<any> {
  return serverMutate<any>(
    `/apis/media/assets/uploads/${body.sessionId}/complete/`,
    { body: { parts: body.parts }, workspace },
  );
}

export async function abortSession(
  sessionId: string,
  workspace: string,
): Promise<void> {
  await serverMutate<void>(
    `/apis/media/assets/uploads/${sessionId}/abort/`,
    { body: {}, method: "POST", workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Transformation presets
 * ────────────────────────────────────────────────────────────────────── */

export async function getTransformationPresets(
  workspace: string,
): Promise<TransformationPreset[]> {
  return serverFetch<TransformationPreset[]>(
    "/apis/media/presets/",
    wsOpts(workspace),
  );
}

export async function seedPresets(
  workspace: string,
): Promise<void> {
  await serverMutate<void>("/apis/media/presets/seed/", {
    body: {},
    workspace,
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * Renditions
 * ────────────────────────────────────────────────────────────────────── */

export async function renderAsset(
  body: { asset_nanoid: string; preset_nanoids: string[] },
  workspace: string,
): Promise<GeneratedAsset> {
  return serverMutate<GeneratedAsset>("/apis/media/renditions/render/", {
    body,
    workspace,
  });
}

export async function getAssetRenditions(
  assetNanoid: string,
  workspace: string,
): Promise<GeneratedAsset[]> {
  return serverFetch<GeneratedAsset[]>(
    `/apis/media/renditions/?asset=${assetNanoid}`,
    wsOpts(workspace),
  );
}

export async function regenerateRendition(
  nanoid: string,
  workspace: string,
): Promise<GeneratedAsset> {
  return serverMutate<GeneratedAsset>(
    `/apis/media/renditions/${nanoid}/regenerate/`,
    { body: {}, method: "POST", workspace },
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Platform presets
 * ────────────────────────────────────────────────────────────────────── */

export async function getPlatformPresets(
  workspace: string,
): Promise<PlatformPresetsResponse> {
  return serverFetch<PlatformPresetsResponse>(
    "/apis/media/presets/platform_presets/",
    wsOpts(workspace),
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Asset usage
 * ────────────────────────────────────────────────────────────────────── */

export async function getAssetUsage(
  assetNanoid: string,
  workspace: string,
): Promise<AssetUsageResponse> {
  return serverFetch<AssetUsageResponse>(
    `/apis/media/assets/${assetNanoid}/usage/`,
    wsOpts(workspace),
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * Asset shares
 * ────────────────────────────────────────────────────────────────────── */

export async function getAssetShares(
  assetNanoid: string,
  workspace: string,
): Promise<AssetShare[]> {
  return serverFetch<AssetShare[]>(
    `/apis/media/asset-shares/?asset=${assetNanoid}`,
    wsOpts(workspace),
  );
}

export async function createAssetShare(
  body: {
    asset: string;
    allow_download?: boolean;
    expires_at?: string | null;
  },
  workspace: string,
): Promise<AssetShare> {
  return serverMutate<AssetShare>("/apis/media/asset-shares/", {
    body,
    workspace,
  });
}

export async function revokeAssetShare(
  nanoid: string,
  workspace: string,
): Promise<AssetShare> {
  return serverMutate<AssetShare>(
    `/apis/media/asset-shares/${nanoid}/revoke/`,
    { body: {}, method: "POST", workspace },
  );
}
