import { requireWorkspace } from "@/lib/auth/server";
import { getFolders } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Plus } from "lucide-react";

export default async function MediaFoldersPage({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: slug } = await params;
  const active = await requireWorkspace(slug);
  const folders = await getFolders({ workspace: active.domain, parent: null }).catch(() => []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Folders</h2>
          <p className="text-sm text-muted-foreground">
            {folders.length} root folder{folders.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Folder
        </Button>
      </div>
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <FolderOpen className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium">No folders yet</p>
          <p className="text-xs mt-1">Create folders to organize your assets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder: any) => (
            <Card key={folder.nanoid} className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="truncate text-base font-semibold">
                      {folder.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {folder.asset_count} asset{folder.asset_count !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
