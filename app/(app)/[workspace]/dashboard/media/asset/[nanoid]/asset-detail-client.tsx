"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Trash2,
  Heart,
  Download,
  Share2,
  Edit3,
  Archive,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  FileArchive as ArchiveIcon,
} from "lucide-react";
import { useToast } from "@/lib/context";
import {
  deleteAssetAction,
  favoriteAssetAction,
  restoreAssetAction,
  trashAssetAction,
  updateAssetAction,
} from "@/app/(app)/[workspace]/dashboard/media/actions";
import type { Asset, AssetVersion } from "@/lib/api";

const ASSET_TYPE_ICONS: Record<string, React.ReactNode> = {
  image: <ImageIcon className="h-5 w-5" />,
  video: <VideoIcon className="h-5 w-5" />,
  audio: <AudioIcon className="h-5 w-5" />,
  document: <FileText className="h-5 w-5" />,
  archive: <ArchiveIcon className="h-5 w-5" />,
};

interface Props {
  workspaceDomain: string;
  asset: Asset;
  versions: AssetVersion[];
}

export function AssetDetailClient({ workspaceDomain, asset: initialAsset, versions }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [asset, setAsset] = useState(initialAsset);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(asset.name);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleFavorite = async () => {
    startTransition(async () => {
      try {
        const updated = await favoriteAssetAction(asset.nanoid, workspaceDomain);
        setAsset(updated);
        toast.push({
          title: updated.favorite ? "Added to favorites" : "Removed from favorites",
          message: updated.favorite ? "Asset added to favorites." : "Asset removed from favorites.",
        });
      } catch {
        toast.push({ title: "Failed to update favorite", message: "Could not update favorite.", variant: "error" });
      }
    });
  };

  const handleTrash = async () => {
    startTransition(async () => {
      try {
        const updated = await trashAssetAction(asset.nanoid, workspaceDomain);
        setAsset(updated);
        toast.push({ title: "Asset moved to trash", message: "The asset has been moved to trash." });
        router.push(`/${workspaceDomain}/dashboard/media/trash`);
      } catch {
        toast.push({ title: "Failed to trash asset", message: "Could not trash the asset.", variant: "error" });
      }
    });
  };

  const handleRestore = async () => {
    startTransition(async () => {
      try {
        const updated = await restoreAssetAction(asset.nanoid, workspaceDomain);
        setAsset(updated);
        toast.push({ title: "Asset restored", message: "The asset has been restored." });
        router.push(`/${workspaceDomain}/dashboard/media/browser`);
      } catch {
        toast.push({ title: "Failed to restore asset", message: "Could not restore the asset.", variant: "error" });
      }
    });
  };

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteAssetAction(asset.nanoid, workspaceDomain);
        toast.push({ title: "Asset permanently deleted", message: "The asset has been permanently deleted.", variant: "success" });
        router.push(`/${workspaceDomain}/dashboard/media/browser`);
      } catch {
        toast.push({ title: "Failed to delete asset", message: "Could not delete the asset.", variant: "error" });
      }
    });
  };

  const handleSaveEdit = async () => {
    if (!editName.trim()) return;
    startTransition(async () => {
      try {
        const updated = await updateAssetAction(
          asset.nanoid,
          { name: editName.trim() },
          workspaceDomain,
        );
        setAsset(updated);
        setIsEditing(false);
        toast.push({ title: "Asset updated", message: "Asset name has been updated." });
      } catch {
        toast.push({ title: "Failed to update asset", message: "Could not update the asset.", variant: "error" });
      }
    });
  };

  const icon = ASSET_TYPE_ICONS[asset.asset_type] || <FileText className="h-5 w-5" />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="max-w-md"
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveEdit} disabled={isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold">{asset.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="capitalize">{asset.asset_type}</Badge>
                  <span className="text-xs text-muted-foreground">{asset.mime_type}</span>
                  {asset.size && (
                    <span className="text-xs text-muted-foreground">
                      {(asset.size / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit3 className="h-4 w-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleFavorite}>
            <Heart className={`h-4 w-4 ${asset.favorite ? "fill-pink-500 text-pink-500" : ""}`} />
          </Button>
          {asset.status === "trashed" ? (
            <Button variant="ghost" size="icon" onClick={handleRestore}>
              <RotateCcw className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="icon" onClick={() => {}}>
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => {}}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleTrash}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="rounded-xl border bg-card ring-0 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-video bg-muted/30 flex items-center justify-center">
                {asset.thumbnail ? (
                  <img
                    src={asset.thumbnail}
                    alt={asset.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    {icon}
                    <p className="text-sm mt-2">No preview available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-xl border bg-card ring-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Name" value={asset.name} />
              <DetailRow label="Type" value={asset.asset_type} />
              <DetailRow label="Format" value={asset.format} />
              <DetailRow label="MIME" value={asset.mime_type} />
              <DetailRow label="Size" value={asset.size ? `${(asset.size / 1024).toFixed(1)} KB` : "—"} />
              {asset.width && asset.height && (
                <DetailRow label="Dimensions" value={`${asset.width} x ${asset.height}`} />
              )}
              <DetailRow label="Status" value={asset.status} />
              <DetailRow label="Source" value={asset.source} />
              <DetailRow label="Hash" value={asset.hash_sha256?.slice(0, 16)} />
            </CardContent>
          </Card>

          {asset.description && (
            <Card className="rounded-xl border bg-card ring-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{asset.description}</p>
              </CardContent>
            </Card>
          )}

          {asset.tags.length > 0 && (
            <Card className="rounded-xl border bg-card ring-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {asset.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {versions.length > 0 && (
        <Card className="rounded-xl border bg-card ring-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.nanoid} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">v{v.version}</span>
                    <span className="text-muted-foreground ml-2">{v.note || "No note"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(v.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete asset permanently?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The asset and all its versions will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate max-w-[200px]">{value || "—"}</span>
    </div>
  );
}
