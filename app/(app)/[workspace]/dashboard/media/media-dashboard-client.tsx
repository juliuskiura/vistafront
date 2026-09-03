"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Images,
  Video,
  FileText,
  HardDrive,
  Heart,
  FolderOpen,
  ChevronRight,
  Image as ImageIcon,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Asset, MediaStats } from "@/lib/api";

const STATS_CONFIG = [
  { key: "total_assets", label: "Total Assets", icon: Images, color: "from-indigo-500 to-blue-600", path: "/dashboard/media/browser" },
  { key: "images", label: "Images", icon: ImageIcon, color: "from-purple-500 to-fuchsia-500", path: "/dashboard/media/browser?asset_type=image" },
  { key: "videos", label: "Videos", icon: Video, color: "from-pink-500 to-rose-500", path: "/dashboard/media/browser?asset_type=video" },
  { key: "documents", label: "Documents", icon: FileText, color: "from-amber-500 to-orange-500", path: "/dashboard/media/browser?asset_type=document" },
] as const;

interface Props {
  workspaceDomain: string;
  stats: MediaStats | null;
  recentAssets: Asset[];
}

export function MediaDashboardClient({ workspaceDomain, stats, recentAssets }: Props) {
  const router = useRouter();

  const quickStats = useMemo(() => {
    if (!stats) return [];
    return [
      { label: "Storage Used", value: stats.storage_used, icon: HardDrive, color: "text-emerald-600 bg-emerald-50" },
      { label: "Favorites", value: String(stats.favorites), icon: Heart, color: "text-pink-600 bg-pink-50" },
      { label: "Collections", value: String(stats.collections), icon: FolderOpen, color: "text-indigo-600 bg-indigo-50" },
      { label: "Folders", value: String(stats.folders), icon: FolderOpen, color: "text-violet-600 bg-violet-50" },
    ];
  }, [stats]);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS_CONFIG.map((item) => (
          <Card
            key={item.key}
            className="cursor-pointer rounded-xl border bg-card ring-0 shadow-sm p-5 hover:shadow-md transition-all group"
            onClick={() => router.push(`/${workspaceDomain}${item.path}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-display font-bold mt-1">{stats?.[item.key] ?? 0}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${item.color} text-white shadow-sm`}>
                <item.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View all <ChevronRight className="h-3 w-3 ml-1" />
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map((item) => (
          <Card key={item.label} className="rounded-xl border bg-card ring-0 shadow-sm p-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{item.value}</p>
                <p className="text-sm text-muted-foreground">{item.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-bold text-foreground">Recent Uploads</h2>
          <p className="text-xs text-muted-foreground">Recently added visual assets ready for channel distribution</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/${workspaceDomain}/dashboard/media/browser`)}
          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold text-xs flex items-center gap-1 hover:underline"
        >
          <span>View All</span>
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>

      {recentAssets.length === 0 ? (
        <Card className="rounded-xl border bg-card ring-0 shadow-sm p-8 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No uploads yet. Start by uploading your first asset.</p>
          <Button className="mt-3" onClick={() => router.push(`/${workspaceDomain}/dashboard/media/upload`)}>
            Upload Files
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
          {recentAssets.slice(0, 4).map((asset) => (
            <Card
              key={asset.nanoid}
              className="cursor-pointer rounded-xl border bg-card ring-0 shadow-sm overflow-hidden"
              onClick={() => router.push(`/${workspaceDomain}/dashboard/media/asset/${asset.nanoid}`)}
            >
              <div className="aspect-square bg-muted/30 flex items-center justify-center">
                {asset.thumbnail ? (
                  <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium truncate">{asset.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{asset.asset_type}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}