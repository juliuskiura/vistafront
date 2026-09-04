import { requireWorkspace } from "@/lib/auth/server";
import { getTrashedAssets } from "@/lib/api";
import type { Asset } from "@/lib/api";

export default async function MediaTrashPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);

  const assets = await getTrashedAssets({ workspace: active.domain, page: 1, page_size: 48 }).catch(() => []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground">{Array.isArray(assets) ? assets.length : 0} items in trash</p>
      </div>
      {Array.isArray(assets) && assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p>Trash is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.isArray(assets) && assets.map((asset: Asset) => (
            <div
              key={asset.nanoid}
              className="group relative aspect-square rounded-lg border bg-muted/50 overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
            >
              {asset.thumbnail ? (
                <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
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
      )}
    </div>
  );
}
