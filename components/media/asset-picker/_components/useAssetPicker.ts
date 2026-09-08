"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Asset, PaginatedAssets, SearchFilters } from "@/lib/api/types";

interface UseAssetPickerOptions {
  open: boolean;
  workspaceDomain: string;
  filters?: Partial<SearchFilters>;
  platformSlug?: string | null;
  debouncedSearch: string;
  assetType: string;
  page: number;
  pageSize: number;
  allowedAssetTypes: string[];
}

interface UseAssetPickerReturn {
  assets: Asset[];
  total: number;
  isLoading: boolean;
  loadAssets: () => Promise<unknown>;
}

function buildQueryString(
  options: Pick<
    UseAssetPickerOptions,
    "filters" | "debouncedSearch" | "assetType" | "page" | "pageSize" | "allowedAssetTypes"
  >,
): string {
  const { filters = {}, debouncedSearch, assetType, page, pageSize, allowedAssetTypes } = options;
  const params: Partial<SearchFilters> = {
    ...filters,
    ...(debouncedSearch ? { text: debouncedSearch } : {}),
    // Only restrict by type when the caller explicitly picked one, or when
    // the platform allows exactly one type. For multi-type platforms, do not
    // force a single `asset_type` filter — otherwise videos (or documents)
    // would silently never appear in the picker.
    ...(assetType
      ? { asset_type: assetType as SearchFilters["asset_type"] }
      : allowedAssetTypes.length === 1
        ? { asset_type: allowedAssetTypes[0] as SearchFilters["asset_type"] }
        : {}),
  };

  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("page_size", String(pageSize));
  if (params.text) searchParams.set("text", String(params.text));
  if (params.asset_type) searchParams.set("asset_type", String(params.asset_type));
  if (params.tags?.length) searchParams.set("tags", params.tags.join(","));
  if (params.folder) searchParams.set("folder", String(params.folder));
  if (params.collection) searchParams.set("collection", String(params.collection));
  if (params.date_from) searchParams.set("date_from", String(params.date_from));
  if (params.date_to) searchParams.set("date_to", String(params.date_to));
  if (params.uploader) searchParams.set("uploader", String(params.uploader));
  if (params.dominant_color) searchParams.set("dominant_color", String(params.dominant_color));
  const fav = params.favorite;
  if (fav !== null && fav !== undefined) searchParams.set("favorite", String(fav));
  const arch = params.archived;
  if (arch !== null && arch !== undefined) searchParams.set("archived", String(arch));
  if (params.width) searchParams.set("width", String(params.width));
  if (params.height) searchParams.set("height", String(params.height));
  if (params.orientation) searchParams.set("orientation", String(params.orientation));
  return searchParams.toString();
}

export function useAssetPicker({
  open,
  workspaceDomain,
  filters = {},
  debouncedSearch,
  assetType,
  page,
  pageSize,
  allowedAssetTypes,
}: UseAssetPickerOptions): UseAssetPickerReturn {
  const queryString = useMemo(
    () =>
      buildQueryString({
        filters,
        debouncedSearch,
        assetType,
        page,
        pageSize,
        allowedAssetTypes,
      }),
    [filters, debouncedSearch, assetType, page, pageSize, allowedAssetTypes],
  );

  const queryFn = useCallback(
    async (): Promise<PaginatedAssets> => {
      // Go through the Next route handler in `app/api/media/assets/route.ts`,
      // which forwards our httpOnly cookies + `X-Workspace` to Django via
      // `serverFetch` (`lib/api/server-fetch.ts`). This avoids calling Django
      // directly from the client and keeps the trailing-slash + auth juggling
      // in one server-side place.
      const response = await fetch(
        `/api/media/assets${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          headers: { "X-Workspace": workspaceDomain },
          credentials: "include",
        },
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch assets: ${response.status}`);
      }
      return response.json();
    },
    [workspaceDomain, queryString],
  );

  const { data, isFetching, refetch } = useQuery<PaginatedAssets>({
    queryKey: [
      "asset-picker",
      workspaceDomain,
      pageSize,
      page,
      debouncedSearch,
      assetType,
      queryString,
    ],
    queryFn,
    enabled: open,
    placeholderData: (previous) => previous,
    refetchOnWindowFocus: false,
  });

  return {
    assets: data?.results ?? [],
    total: data?.count ?? 0,
    isLoading: isFetching,
    loadAssets: () => refetch(),
  };
}
