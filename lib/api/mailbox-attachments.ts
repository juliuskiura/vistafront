"use server";

/**
 * Attachment upload / removal.
 *
 * EXCEPTION to the "everything goes through serverFetch/serverMutate" rule,
 * and for the same reason `createAsset` / `patchAssetMultipart` are exceptions
 * in `media.ts`: those two are JSON-only and cannot carry a multipart
 * `FormData` body, so this hand-rolls the request with the same cookie, CSRF
 * and `X-Workspace` headers. The upload stays on the server because a Server
 * Action can receive the `File` in its own FormData, so nothing is ever
 * fetched from the browser.
 *
 * The `screenFiles` pre-flight lives in `lib/mailbox/attachment-rules.ts`
 * because a `"use server"` module may only export async functions.
 */

import { cookies } from "next/headers";

import { serverMutate } from "./server-fetch";
import type { Attachment } from "./mailbox";

const BASE = "/apis/mailbox";

/** POST one file to an existing (typically draft) email. */
export async function uploadAttachment(
  emailNanoid: string,
  file: File,
  workspace: string,
): Promise<Attachment> {
  const cookieStore = await cookies();
  const access = cookieStore.get("access");
  const refresh = cookieStore.get("refresh");
  const csrf = cookieStore.get("csrftoken");

  const headers: HeadersInit = {};
  const cookieHeader = [
    access ? `access=${access.value}` : null,
    refresh ? `refresh=${refresh.value}` : null,
  ]
    .filter(Boolean)
    .join("; ");
  if (cookieHeader) headers.Cookie = cookieHeader;
  if (csrf) headers["X-CSRFToken"] = csrf.value;
  if (workspace) headers["X-Workspace"] = workspace;

  const body = new FormData();
  body.append("file", file, file.name);

  const response = await fetch(
    `${process.env.BACKEND_URL || "http://127.0.0.1:8000"}${BASE}/emails/${emailNanoid}/attachments/`,
    { method: "POST", headers, body, cache: "no-store" },
  );

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Upload failed (${response.status}): ${detail.slice(0, 200)}`,
    );
  }

  return (await response.json()) as Attachment;
}

export async function deleteAttachment(
  emailNanoid: string,
  attachmentNanoid: string,
  workspace: string,
): Promise<void> {
  await serverMutate(
    `${BASE}/emails/${emailNanoid}/attachments/${attachmentNanoid}/`,
    { method: "DELETE", body: {}, workspace },
  );
}
