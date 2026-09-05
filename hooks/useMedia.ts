import { useQuery, useMutation } from "@tanstack/react-query";

const DJANGO_API_BASE =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function dj(path: string): string {
  return `${DJANGO_API_BASE}${path}`;
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

export function useGetAssetMetasQuery(nanoid: string, workspace?: string) {
  return useQuery({
    queryKey: ["asset-metas", nanoid],
    queryFn: async () => {
      const res = await fetch(dj(`/apis/media/asset-meta/?asset=${nanoid}`), {
        credentials: "include",
        headers: mediaHeaders(workspace),
      });
      return res.json();
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
