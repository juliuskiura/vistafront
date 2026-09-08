"use client";

import { Search, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchAndFiltersProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  assetType: string;
  onAssetTypeChange: (value: string) => void;
  onClearFilters: () => void;
  onUploadClick: () => void;
  disabled?: boolean;
}

export function SearchAndFilters({
  searchText,
  onSearchChange,
  assetType,
  onAssetTypeChange,
  onClearFilters,
  onUploadClick,
  disabled,
}: SearchAndFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Search assets…"
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
          disabled={disabled}
        />
      </div>
      <select
        value={assetType}
        onChange={(e) => onAssetTypeChange(e.target.value)}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
        aria-label="Filter by asset type"
        disabled={disabled}
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
          onClick={onClearFilters}
          className="shrink-0"
          disabled={disabled}
        >
          <X size={14} className="mr-1" />
          Clear
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={onUploadClick}
        disabled={disabled}
        className="shrink-0"
      >
        <Upload size={14} className="mr-1" />
        Upload
      </Button>
    </div>
  );
}