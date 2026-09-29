"use client";

import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Asset, SearchFilters } from "@/lib/api/types";

import { AssetGrid } from "./_components/AssetGrid";
import { SearchAndFilters } from "./_components/SearchAndFilters";
import { Pagination } from "./_components/Pagination";
import { Footer } from "./_components/Footer";
import { Header } from "./_components/Header";
import { useAssetPicker } from "./_components/useAssetPicker";

export interface AssetPickerProps {
  mode: "single" | "multiple";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (assets: Asset | Asset[]) => void;
  filters?: Partial<SearchFilters>;
  maxItems?: number;
  title?: string;
  workspaceDomain: string;
  platformSlug?: string | null;
  /**
   * What media the target format actually accepts, so the type filter follows
   * the platform's own rules instead of a hardcoded list of slugs.
   *
   * The previous slug list had two problems: it was missing slugs that are
   * doors rather than brands (`instagramfb`, so the Facebook-Page Instagram
   * door fell through to a default by accident), and it named `twitter`, a
   * slug the platform union no longer uses. More fundamentally it answered a
   * per-platform question when the real question is per-format — a reel takes
   * video only, a feed post takes either — and the platform row already knows
   * the difference.
   *
   * Omit it to show every type, which is the right default for a picker that is
   * not being opened for a specific format.
   */
  allowedAssetTypes?: string[];
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
  platformSlug,
  allowedAssetTypes = [],
}: AssetPickerProps) {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [assetType, setAssetType] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  const { assets, total, isLoading } = useAssetPicker({
    open,
    workspaceDomain,
    filters,
    platformSlug,
    debouncedSearch,
    assetType,
    page,
    pageSize,
    allowedAssetTypes,
  });

  const isMulti = mode === "multiple";
  const canSelectMore = !maxItems || selected.size < maxItems;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedList = assets.filter((a) => selected.has(a.nanoid));

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
      onSelect(selectedList);
    } else if (selected.size === 1) {
      const asset = assets.find((a) => a.nanoid === Array.from(selected)[0]);
      if (asset) onSelect(asset);
    }
    onOpenChange(false);
  }

  function handleCancel() {
    onOpenChange(false);
  }

  function handleOpenChange(nextOpen: boolean) {
    // Reset the picker when the dialog closes so a fresh open starts clean.
    if (!nextOpen && open) {
      setSearchText("");
      setDebouncedSearch("");
      setSelected(new Set());
      setPage(1);
      setAssetType("");
    }
    onOpenChange(nextOpen);
  }

  function handleUploadClick() {
    const uploadUrl = `/${workspaceDomain}/dashboard/media/upload`;
    window.open(uploadUrl, "_blank", "noopener,noreferrer");
  }

  function handleSearchChange(value: string) {
    setSearchText(value);
    setPage(1);
  }

  function handleAssetTypeChange(value: string) {
    setAssetType(value);
    setPage(1);
  }

  function handleClearFilters() {
    setSearchText("");
    setAssetType("");
    setPage(1);
  }

  function handlePageChange(newPage: number) {
    setPage(newPage);
  }

  function handlePageSizeChange(newPageSize: number) {
    setPageSize(newPageSize);
    setPage(1);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-3xl gap-0 overflow-hidden p-0 flex flex-col max-h-[80vh]">
        <Header title={title} isMulti={isMulti} selectedCount={selected.size} />

        <div className="px-5 py-3 space-y-3 border-b shrink-0">
          <SearchAndFilters
            searchText={searchText}
            onSearchChange={handleSearchChange}
            assetType={assetType}
            onAssetTypeChange={handleAssetTypeChange}
            onClearFilters={handleClearFilters}
            onUploadClick={handleUploadClick}
            disabled={maxItems !== undefined && selected.size >= maxItems}
          />
        </div>

        <ScrollArea className="flex-1 max-h-64 overflow-auto px-5 py-3 relative">
          <AssetGrid
            assets={assets}
            selected={selected}
            onToggle={toggleSelect}
            canSelectMore={canSelectMore}
            isMulti={isMulti}
            isLoading={isLoading}
            pageSize={pageSize}
          />
        </ScrollArea>

        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />

        <Footer
          selectedList={selectedList}
          isMulti={isMulti}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}