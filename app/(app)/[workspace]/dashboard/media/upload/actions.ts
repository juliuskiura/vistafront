"use server";

import { revalidatePath } from "next/cache";
import { presignUpload, confirmUpload } from "@/lib/api";

export async function getPresignedUrlAction(
  workspace: string,
  filename: string,
  mimeType?: string,
  size?: number,
) {
  try {
    return await presignUpload({ filename, mime_type: mimeType, size }, workspace);
  } catch {
    throw new Error("Failed to get upload URL.");
  }
}

export async function confirmUploadAction(
  workspace: string,
  key: string,
  filename: string,
  mimeType?: string,
  size?: number,
) {
  try {
    const asset = await confirmUpload({ key, filename, mime_type: mimeType, size }, workspace);
    revalidatePath(`/[workspace]/dashboard/media`, "page");
    return asset;
  } catch {
    throw new Error("Failed to confirm upload.");
  }
}
