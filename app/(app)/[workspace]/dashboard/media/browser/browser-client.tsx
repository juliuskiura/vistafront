"use client";

import { useMemo, useState, useCallback, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Grid3x3, List, Search, Upload, FolderPlus } from "lucide-react";
import type { Asset, PaginatedAssets, ViewMode, SortKey, SortDir } from "@/lib/api";

interface Props {
  workspaceDomain: string;
  initialAssets: PaginatedAssets;
  initialSearch: string;
  initialAssetType: string;
  pageSize: number;
}

export function BrowserClient({
  workspaceDomain,
  initialAssets,
  initialSearch,
  initialAssetType,
  pageSize,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState(initialSearch);
  const [assetTypeFilter, setAssetTypeFilter] = useState(initialAssetType);

  const assets = useMemo(() => initialAssets.results ?? [], [initialAssets]);

  const updateSearchParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      startTransition(() => {
        router.push(`/${workspaceDomain}/dashboard/media/browser?${params.toString()}`);
      });
    },
    [router, searchParams, workspaceDomain],
  );

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      updateSearchParams({ text: value || undefined, page: "1" });
    },
    [updateSearchParams],
  );

  const handleAssetTypeChange = useCallback(
    (value: string) => {
      setAssetTypeFilter(value);
      updateSearchParams({ asset_type: value || undefined, page: "1" });
    },
    [updateSearchParams],
  );

  const handleSort = useCallback((key: SortKey) => {
    setSortKey((prev) => {
      if (prev === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prev;
      }
      setSortDir("asc");
      return key;
    });
  }, []);

  const sortedAssets = useMemo(() => {
    const sorted = [...assets];
    sorted.sort((a, b) => {
      let aVal: string | number = "";
      let bVal: string | number = "";
      switch (sortKey) {
        case "name":
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case "date":
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case "size":
          aVal = a.size || 0;
          bVal = b.size || 0;
          break;
        case "type":
          aVal = a.asset_type;
          bVal = b.asset_type;
          break;
      }
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return sorted;
  }, [assets, sortKey, sortDir]);

  const currentPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.max(1, Math.ceil((initialAssets.count || 0) / (pageSize || 24)));

  const goToPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      startTransition(() => {
        router.push(`/${workspaceDomain}/dashboard/media/browser?${params.toString()}`);
      });
    },
    [router, searchParams, workspaceDomain],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assets..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={assetTypeFilter}
          onChange={(e) => handleAssetTypeChange(e.target.value)}
          className="rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary/50"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="document">Documents</option>
          <option value="audio">Audio</option>
          <option value="archive">Archives</option>
        </select>
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode("grid")}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-none"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-sm text-muted-foreground">
          {initialAssets.count} asset{initialAssets.count !== 1 ? "s" : ""}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/${workspaceDomain}/dashboard/media/folders`)}
          >
            <FolderPlus className="h-4 w-4 mr-1" />
            New Folder
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/${workspaceDomain}/dashboard/media/upload`)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
      </div>

      {sortedAssets.length === 0 ? (
        <Card className="rounded-xl border bg-card ring-0 shadow-sm p-8 text-center">
          <p className="text-sm text-muted-foreground">No assets found. Try adjusting your search or upload new files.</p>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {sortedAssets.map((asset) => (
            <Card
              key={asset.nanoid}
              className="cursor-pointer rounded-xl border bg-card ring-0 shadow-sm overflow-hidden"
              onClick={() => router.push(`/${workspaceDomain}/dashboard/media/asset/${asset.nanoid}`)}
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center">
                {asset.thumbnail ? (
                  <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <FileTextIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{asset.asset_type}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="border rounded-xl divide-y">
          {sortedAssets.map((asset) => (
            <div
              key={asset.nanoid}
              className="flex items-center gap-4 p-3 hover:bg-muted/30 cursor-pointer"
              onClick={() => router.push(`/${workspaceDomain}/dashboard/media/asset/${asset.nanoid}`)}
            >
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                {asset.thumbnail ? (
                  <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <FileTextIcon className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{asset.asset_type}</p>
              </div>
              <div className="text-xs text-muted-foreground">
                {asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : "—"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
