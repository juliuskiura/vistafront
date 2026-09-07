"use client";

import Image from "next/image";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AssetSelectionToolbar } from "@/components/media/asset-selection-toolbar";
import type { Asset } from "@/lib/api";

interface Props {
  workspaceDomain: string;
  assets: Asset[];
}

export function TrashClient({ workspaceDomain, assets }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggleSelection = useCallback((nanoid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(nanoid)) {
        next.delete(nanoid);
      } else {
        next.add(nanoid);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const selectedAssets = useMemo(
    () => assets.filter((a) => selected.has(a.nanoid)),
    [assets, selected],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground">{assets.length} items in trash</p>
      </div>
      {assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>Trash is empty</p>
        </div>
      ) : (
        <>
          <AssetSelectionToolbar
            selectedAssets={selectedAssets}
            workspaceDomain={workspaceDomain}
            onClear={clearSelection}
            mode="trash"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {assets.map((asset) => (
              <div
                key={asset.nanoid}
                className="group relative aspect-square rounded-lg border bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => router.push(`/${workspaceDomain}/dashboard/media/asset/${asset.nanoid}`)}
              >
                <input
                  type="checkbox"
                  aria-label="Select asset"
                  checked={selected.has(asset.nanoid)}
                  onChange={() => toggleSelection(asset.nanoid)}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute top-2 left-2 z-10 size-4 cursor-pointer rounded border-input bg-white/80"
                />
                {asset.thumbnail ? (
                  <Image src={asset.thumbnail} alt={asset.name} fill unoptimized className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground capitalize">
                    {asset.asset_type}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-xs text-white truncate">{asset.name}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
