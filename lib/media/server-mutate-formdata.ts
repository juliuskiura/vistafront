/**
 * Client-side helper for multipart FormData mutations from Server Actions.
 * `serverMutate` in `lib/api/server-fetch.ts` JSON-stringifies the body, so
 * it cannot send FormData directly. This small helper uses raw `fetch` with
 * the same cookie/CSRF/workspace forwarding rules.
 */
"use server";

import { cookies } from "next/headers";
import { ServerFetchError } from "@/lib/api/server-fetch-types";

const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function serverMutateFormData<T>(
  path: string,
  formData: FormData,
  options: { method?: string; workspace?: string } = {},
): Promise<T> {
  const cookieStore = await cookies();
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

  if (options.workspace) {
    headers["X-Workspace"] = options.workspace;
  }

  const response = await fetch(`${BACKEND_URL}${path}`, {
    method: options.method || "POST",
    headers,
    body: formData,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ServerFetchError(response.status, errorText, path);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return (await response.json()) as T;
}
