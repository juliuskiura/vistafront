"use server";

import {
  initiateUpload,
  getSessionParts,
  commitSession,
  abortSession,
  getUploadConfig,
} from "@/lib/api/media";
import { serverMutateFormData } from "./server-mutate-formdata";

export async function initiateUploadAction(
  file_name: string,
  file_size: number,
  content_type?: string,
  workspace?: string,
) {
  return initiateUpload({ file_name, file_size, content_type }, workspace || "");
}

export async function getSessionPartsAction(
  sessionId: string,
  workspace?: string,
) {
  return getSessionParts(sessionId, workspace || "");
}

export async function commitSessionAction(
  sessionId: string,
  parts: Array<{ part_number: number; etag: string }>,
  workspace?: string,
) {
  return commitSession({ sessionId, parts }, workspace || "");
}

export async function abortSessionAction(
  sessionId: string,
  workspace?: string,
) {
  return abortSession(sessionId, workspace || "");
}

export async function getUploadConfigAction(workspace?: string) {
  return getUploadConfig(workspace || "");
}

export async function patchAssetMultipartAction(
  nanoid: string,
  formData: FormData,
  workspace?: string,
) {
  return serverMutateFormData<{
    nanoid: string;
  }>(`/apis/media/assets/${nanoid}/`, formData, {
    method: "PATCH",
    workspace,
  });
}
