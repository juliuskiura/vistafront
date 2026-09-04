"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, FileText, Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updateAssetAction } from "@/app/(app)/[workspace]/dashboard/media/actions";
import { useToast } from "@/lib/context";
import type { Asset } from "@/lib/api";

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AssetMetadataInspectorProps {
  asset: Asset;
  workspaceDomain: string;
  onAssetUpdated?: (updated: Asset) => void;
}

export function AssetMetadataInspector({ asset, workspaceDomain, onAssetUpdated }: AssetMetadataInspectorProps) {
  const toast = useToast();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(asset.name);
  const [description, setDescription] = useState(asset.description || "");
  const [altText, setAltText] = useState(asset.alt_text || "");
  const [tags, setTags] = useState<string[]>(asset.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(asset.name);
    setDescription(asset.description || "");
    setAltText(asset.alt_text || "");
    setTags(asset.tags || []);
    setSaved(false);
  }, [asset.nanoid]);

  const dirty =
    name !== asset.name ||
    description !== (asset.description || "") ||
    altText !== (asset.alt_text || "") ||
    tags.join(",") !== (asset.tags || []).join(",");

  const addTag = () => {
    const clean = tagInput.trim().replace(/^#/, "");
    if (!clean || tags.includes(clean)) {
      setTagInput("");
      return;
    }
    setTags([...tags, clean]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSave = async () => {
    startTransition(async () => {
      try {
        const updated = await updateAssetAction(
          asset.nanoid,
          { name, description, alt_text: altText, tags },
          workspaceDomain,
        );
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onAssetUpdated?.(updated);
        toast.push({ title: "Metadata updated", message: "Asset metadata has been saved." });
      } catch {
        toast.push({ title: "Failed to update", message: "Could not save metadata.", variant: "error" });
      }
    });
  };

  return (
    <Card className="rounded-xl border border-border bg-card p-5 shadow-sm ring-0">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <FileText className="h-4 w-4 text-primary" />
          Asset Metadata Inspector
        </h3>
        <Button
          size="sm"
          disabled={!dirty || isPending}
          onClick={handleSave}
          className="!px-4 !py-1.5 !text-xs"
        >
          {saved ? <Check className="h-3.5 w-3.5 mr-1" /> : null}
          {saved ? "Saved!" : isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-4 pt-4">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Display Title
          </Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Description
          </Label>
          <Textarea
            rows={3}
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Alt Text (Accessibility)
          </Label>
          <Input
            value={altText}
            placeholder="Describe visual content for screen readers..."
            onChange={(e) => setAltText(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tags &amp; Keywords
          </Label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="text-muted-foreground transition-colors hover:text-destructive"
                  aria-label={`Remove ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {tags.length === 0 && (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
          <div className="flex gap-2 pt-1">
            <Input
              value={tagInput}
              placeholder="Add new tag..."
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={addTag}
              className="!px-3 !py-1.5 shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-t border-border pt-4">
        <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          System Properties
        </Label>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: "Dimensions", value: asset.width && asset.height ? `${asset.width} × ${asset.height}` : "—" },
            { label: "Size", value: formatSize(asset.size) },
            { label: "Format", value: asset.format || asset.mime_type || "—" },
            { label: "Extension", value: asset.extension ? `.${asset.extension}` : "—" },
            { label: "Uploaded", value: new Date(asset.created_at).toLocaleString() },
            { label: "Modified", value: new Date(asset.updated_at).toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 rounded-lg bg-muted px-3 py-2">
              <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
              <span className="break-all font-medium text-foreground">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
