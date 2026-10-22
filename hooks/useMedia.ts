import { useQuery, useMutation } from "@tanstack/react-query";
import type { AssetMeta } from "@/lib/api";

/**
 * Same-origin API path. The browser never addresses Django directly: nginx
 * routes /apis/ to Django and Next.js rewrites it in local dev, so a relative
 * path lands correctly in every environment and keeps the request same-site
 * with the httpOnly `access` cookie.
 */
function dj(path: string): string {
  return path;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&") + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function mediaHeaders(workspace?: string): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (workspace) headers["X-Workspace"] = workspace;
  const csrf = getCookie("csrftoken");
  if (csrf) headers["X-CSRFToken"] = csrf;
  return headers;
}

/**
 * Unwrap a paginated Django list payload.
 *
 * `/apis/media/asset-meta/` answers `{count, next, previous, results}`, not a
 * bare array. Handing that object to a consumer that expects a list is what
 * produced `TypeError: e.find is not a function` in the player: the crash
 * happened inside a `useEffect` during the asset detail render, so the whole
 * authenticated segment fell over to the error boundary and the video never
 * got a chance to play.
 */
function toResults<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[];
  const results = (payload as { results?: unknown })?.results;
  return Array.isArray(results) ? (results as T[]) : [];
}

export function useGetAssetMetasQuery(nanoid: string, workspace?: string) {
  return useQuery({
    queryKey: ["asset-metas", nanoid],
    queryFn: async () => {
      const res = await fetch(dj(`/apis/media/asset-meta/?asset=${nanoid}`), {
        credentials: "include",
        headers: mediaHeaders(workspace),
      });
      return toResults<AssetMeta>(await res.json());
    },
  });
}

export function useUpdateAssetMutation(workspace?: string) {
  return useMutation({
    mutationFn: async ({ nanoid, data }: { nanoid: string; data: any }) => {
      const res = await fetch(dj(`/apis/media/assets/${nanoid}/`), {
        method: "PATCH",
        headers: mediaHeaders(workspace),
        credentials: "include",
        body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}

export function useCreateAssetMetaMutation(workspace?: string) {
  return useMutation({
    mutationFn: async (body: { asset: string; key: string; value: string }) => {
      const res = await fetch(dj("/apis/media/asset-meta/"), {
        method: "POST",
        headers: mediaHeaders(workspace),
        credentials: "include",
        body: JSON.stringify(body),
      });
      return res.json();
    },
  });
}

export function useUpdateAssetMetaMutation(workspace?: string) {
  return useMutation({
    mutationFn: async ({ nanoid, data }: { nanoid: string; data: any }) => {
      const res = await fetch(dj(`/apis/media/asset-meta/${nanoid}/`), {
        method: "PATCH",
        headers: mediaHeaders(workspace),
        credentials: "include",
        body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}

export function usePatchAssetMutation(workspace?: string) {
  return useMutation({
    mutationFn: async ({ nanoid, data }: { nanoid: string; data: any }) => {
      const res = await fetch(dj(`/apis/media/assets/${nanoid}/`), {
        method: "PATCH",
        headers: mediaHeaders(workspace),
        credentials: "include",
        body: JSON.stringify(data),
      });
      return res.json();
    },
  });
}
