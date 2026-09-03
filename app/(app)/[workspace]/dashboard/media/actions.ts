"use server";

import { revalidatePath } from "next/cache";
import {
  bulkDeleteAssets,
  bulkFavoriteAssets,
  deleteAsset,
  favoriteAsset,
  getAsset,
  restoreAsset,
  trashAsset,
  updateAsset,
  type Asset,
} from "@/lib/api";

export interface MediaActionState {
  status: "idle" | "success" | "error";
  message?: string;
}

export const initialMediaActionState: MediaActionState = {
  status: "idle",
};

export async function deleteAssetAction(
  nanoid: string,
  workspace: string,
): Promise<MediaActionState> {
  try {
    await deleteAsset(nanoid, workspace);
    revalidatePath(`/[workspace]/dashboard/media`, "page");
    return { status: "success", message: "Asset deleted." };
  } catch {
    return { status: "error", message: "Failed to delete asset." };
  }
}

export async function trashAssetAction(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  const asset = await trashAsset(nanoid, workspace);
  revalidatePath(`/[workspace]/dashboard/media`, "page");
  return asset;
}

export async function restoreAssetAction(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  const asset = await restoreAsset(nanoid, workspace);
  revalidatePath(`/[workspace]/dashboard/media`, "page");
  return asset;
}

export async function favoriteAssetAction(
  nanoid: string,
  workspace: string,
): Promise<Asset> {
  const asset = await favoriteAsset(nanoid, workspace);
  revalidatePath(`/[workspace]/dashboard/media`, "page");
  return asset;
}

export async function updateAssetAction(
  nanoid: string,
  data: Partial<Asset>,
  workspace: string,
): Promise<Asset> {
  const asset = await updateAsset(nanoid, data, workspace);
  revalidatePath(`/[workspace]/dashboard/media`, "page");
  return asset;
}

export async function bulkDeleteAssetsAction(
  nanoids: string[],
  workspace: string,
): Promise<{ deleted: number; failed: number }> {
  if (!workspace || nanoids.length === 0) return { deleted: 0, failed: 0 };
  const results = await Promise.allSettled(
    nanoids.map((nanoid) => deleteAsset(nanoid, workspace)),
  );
  const failed = results.filter((r) => r.status === "rejected").length;
  const deleted = results.length - failed;
  revalidatePath(`/[workspace]/dashboard/media`, "page");
  return { deleted, failed };
}

export async function bulkFavoriteAssetsAction(
  nanoids: string[],
  favorite: boolean,
  workspace: string,
): Promise<{ updated: number }> {
  const result = await bulkFavoriteAssets(nanoids, favorite, workspace);
  revalidatePath(`/[workspace]/dashboard/media`, "page");
  return result;
}
