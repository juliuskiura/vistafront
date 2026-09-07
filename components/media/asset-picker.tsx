"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Search, X, Upload, Check, ImagePlus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Asset, SearchFilters } from "@/lib/api/types";
import { searchAssets, getAssets } from "@/lib/api/media";
import type { PaginatedAssets } from "@/lib/api/types";

export interface AssetPickerProps {
  mode: "single" | "multiple";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assets: Asset | Asset[]) => void;
  filters?: Partial<SearchFilters>;
  maxItems?: number;
  title?: string;
  workspaceDomain: string;
}

export default function AssetPicker({
  mode,
  open,
  onOpenChange,
  onSelect,
  filters = {},
  maxItems,
  title = "Select Asset",
  workspaceDomain,
}: AssetPickerProps) {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [assetType, setAssetType] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!open) {
      setSearchText("");
      setDebouncedSearch("");
      setSelected(new Set());
      setPage(1);
      setAssetType("");
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setIsLoading(true);
    async function load() {
      try {
        const params = {
          ...filters,
          ...(debouncedSearch ? { text: debouncedSearch } : {}),
          ...(assetType ? { asset_type: assetType } : {}),
        } as SearchFilters;
        const result: PaginatedAssets = await getAssets({
          params,
          page,
          page_size: pageSize,
          workspace: workspaceDomain,
        });
        if (!cancelled) {
          setAssets(result.results ?? []);
          setTotal(result.count ?? 0);
        }
      } catch {
        if (!cancelled) {
          setAssets([]);
          setTotal(0);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [open, debouncedSearch, assetType, page, pageSize, filters, workspaceDomain]);

  const isMulti = mode === "multiple";
  const canSelectMore = !maxItems || selected.size < maxItems;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleSelect(asset: Asset) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (isMulti) {
        if (next.has(asset.nanoid)) {
          next.delete(asset.nanoid);
        } else if (canSelectMore) {
          next.add(asset.nanoid);
        }
      } else {
        if (next.has(asset.nanoid)) {
          next.clear();
        } else {
          next.clear();
          next.add(asset.nanoid);
        }
      }
      return next;
    });
  }

  function handleConfirm() {
    if (isMulti) {
      const chosen = assets.filter((a) => selected.has(a.nanoid));
      onSelect(chosen);
    } else if (selected.size === 1) {
      const asset = assets.find((a) => a.nanoid === Array.from(selected)[0]);
      if (asset) onSelect(asset);
    }
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    // For now, create local object URLs for preview.
    // In production, you'd upload these via createAsset.
    const newAssets: Asset[] = Array.from(files).map((file, idx) => ({
      nanoid: `upload-${Date.now()}-${idx}`,
      name: file.name,
      description: "",
      alt_text: "",
      asset_type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "other",
      mime_type: file.type,
      extension: file.name.split(".").pop() || "",
      size: file.size,
      width: null,
      height: null,
      duration_seconds: null,
      format: "",
      hash_sha256: "",
      source: "upload" as const,
      status: "processing" as const,
      original_file: URL.createObjectURL(file),
      stream_url: null,
      thumbnail: URL.createObjectURL(file),
      dominant_colors: [],
      exif: {},
      owner: null,
      tags: [],
      favorite: false,
      pinned: false,
      archived: false,
      original: null,
      extra: {},
      workspace: workspaceDomain,
      created_by: "",
      user: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      collections: [],
      folders: [],
    }));
    setAssets((prev) => [...newAssets, ...prev]);
    setTotal((prev) => prev + newAssets.length);
    if (mode === "single") {
      setSelected(new Set([newAssets[0].nanoid]));
    } else {
      setSelected((prev) => new Set([...prev, ...newAssets.map((a) => a.nanoid)]));
    }
    e.target.value = "";
  }

  const selectedList = useMemo(() => assets.filter((a) => selected.has(a.nanoid)), [assets, selected]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl gap-0 overflow-hidden p-0 flex flex-col max-h-[80vh]">
        <DialogHeader className="bg-indigo-600 px-5 py-4 shrink-0">
          <DialogTitle className="text-white flex items-center gap-2">
            <ImagePlus size={18} />
            {title}
            {isMulti && selected.size > 0 && (
              <Badge variant="secondary" className="ml-2">
                {selected.size} selected
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-3 space-y-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search assets…"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={assetType}
              onChange={(e) => {
                setAssetType(e.target.value);
                setPage(1);
              }}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
              aria-label="Filter by asset type"
            >
              <option value="">All types</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
            </select>
            {(searchText || assetType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchText("");
                  setAssetType("");
                  setPage(1);
                }}
                className="shrink-0"
              >
                <X size={14} className="mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleUploadClick}
              disabled={maxItems !== undefined && selected.size >= maxItems}
              className="shrink-0"
            >
              <Upload size={14} className="mr-1" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple={isMulti}
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload file"
            />
          </div>
        </div>

        <ScrollArea className="flex-1 max-h-64 overflow-auto px-5 py-3 relative">
          {isLoading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl border bg-white p-2">
                  <div className="aspect-square w-full animate-pulse rounded-lg bg-slate-200" />
                  <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && assets.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Search size={32} className="text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No assets found</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search or filters.</p>
            </div>
          )}

          {!isLoading && assets.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {assets.map((asset) => {
                const thumb = asset.thumbnail || asset.original_file;
                const isSelected = selected.has(asset.nanoid);
                return (
                  <button
                    key={asset.nanoid}
                    type="button"
                    onClick={() => toggleSelect(asset)}
                    className={cn(
                      "group relative flex flex-col items-center gap-1.5 rounded-xl border bg-white p-2 text-left transition-all",
                      isSelected
                        ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50"
                        : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
                      !canSelectMore && isMulti && !isSelected && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <ImagePlus className="h-8 w-8" />
                        </div>
                      )}
                      {(isMulti || !isMulti) && (
                        <div
                          className={cn(
                            "absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-md border-2 bg-white/80 backdrop-blur-sm transition-all",
                            isSelected
                              ? "border-indigo-600 bg-indigo-600 text-white"
                              : "border-slate-300 bg-white",
                          )}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                      )}
                    </div>
                    <p className="w-full truncate text-xs font-medium text-slate-700">{asset.name}</p>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs"
              aria-label="Assets per page"
            >
              <option value={12}>12 / page</option>
              <option value={24}>24 / page</option>
              <option value={48}>48 / page</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-5 py-3 shrink-0">
          {isMulti && selectedList.length > 0 && (
            <div className="mr-auto flex items-center gap-2">
              <Badge variant="secondary">{selectedList.length} selected</Badge>
            </div>
          )}
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isMulti ? selected.size === 0 : selected.size !== 1}
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            {isMulti ? `Select ${selected.size}` : "Select"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
