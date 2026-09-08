"use client";

import { Check, Play } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Asset } from "@/lib/api/types";

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
  isMulti: boolean;
}

export function AssetCard({ asset, isSelected, onToggle, disabled, isMulti }: AssetCardProps) {
  const thumb = asset.thumbnail || asset.original_file;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "group relative flex flex-col items-center gap-1.5 rounded-xl border bg-white p-2 text-left transition-all",
        isSelected
          ? "border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-50"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-100">
        {thumb ? (
          <Image
            src={thumb}
            alt={asset.name}
            fill
            unoptimized
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 20vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {asset.asset_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="flex size-10 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm">
              <Play className="size-5 text-white fill-white ml-0.5" />
            </div>
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
}