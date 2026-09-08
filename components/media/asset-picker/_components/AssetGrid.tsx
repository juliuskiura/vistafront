"use client";

import type { Asset } from "@/lib/api/types";
import { AssetCard } from "./AssetCard";

interface AssetGridProps {
  assets: Asset[];
  selected: Set<string>;
  onToggle: (asset: Asset) => void;
  canSelectMore: boolean;
  isMulti: boolean;
  isLoading: boolean;
  pageSize: number;
}

export function AssetGrid({ assets, selected, onToggle, canSelectMore, isMulti, isLoading, pageSize }: AssetGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: pageSize > 12 ? 12 : pageSize }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5 rounded-xl border bg-white p-2">
            <div className="aspect-square w-full animate-pulse rounded-lg bg-slate-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg className="h-8 w-8 text-slate-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-sm font-medium text-slate-600">No assets found</p>
        <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {assets.map((asset) => (
          <AssetCard
            key={asset.nanoid}
            asset={asset}
            isSelected={selected.has(asset.nanoid)}
            onToggle={() => onToggle(asset)}
            disabled={!canSelectMore && isMulti && !selected.has(asset.nanoid)}
            isMulti={isMulti}
          />
        ))}
      </div>
    </>
  );
}