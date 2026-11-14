"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, MoreVertical } from "@/lib/icons";
import type { PackageFeature, ProductPricingFeature } from "@/lib/api";
import {
  moveFeatureInPackageAction,
  removeFeatureFromPackageFormAction,
  updateFeatureAction,
  type FeatureActionState,
} from "../actions";

const initialFeatureState: FeatureActionState = { status: "idle" };

export function PackageFeatureRow({
  feature,
  raw,
  packageNanoid,
  workspace,
  product,
  featureGroups,
  isFirst,
  isLast,
}: {
  feature: ProductPricingFeature;
  raw: PackageFeature | null;
  packageNanoid: string;
  workspace: string;
  product: string;
  featureGroups: { nanoid: string; name: string }[];
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const [moving, startMove] = useTransition();

  function handleMove(direction: "up" | "down" | "top" | "bottom") {
    const formData = new FormData();
    formData.set("nanoid", feature.nanoid);
    formData.set("package", packageNanoid);
    formData.set("product", product);
    formData.set("workspace", workspace);
    formData.set("direction", direction);
    startMove(async () => {
      await moveFeatureInPackageAction(formData);
    });
  }

  function handleDelete() {
    const formData = new FormData();
    formData.set("nanoid", feature.nanoid);
    formData.set("package", packageNanoid);
    formData.set("product", product);
    formData.set("workspace", workspace);
    startDelete(async () => {
      await removeFeatureFromPackageFormAction(formData);
      setDeleteOpen(false);
    });
  }

  return (
    <li className="flex items-start justify-between gap-2">
      <span className="flex items-start gap-2">
        <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
        <span className={feature.bolded ? "font-semibold" : undefined}>
          {feature.order}. {feature.name}
        </span>
      </span>
      <div className="flex items-center gap-1">
        <div className="flex flex-col items-center">
          <form action={moveFeatureInPackageAction}>
            <input type="hidden" name="nanoid" value={feature.nanoid} />
            <input type="hidden" name="package" value={packageNanoid} />
            <input type="hidden" name="product" value={product} />
            <input type="hidden" name="workspace" value={workspace} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              disabled={isFirst}
              className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`Move ${feature.name} up`}
            >
              <ChevronUp className="size-4" />
            </button>
          </form>
          <form action={moveFeatureInPackageAction}>
            <input type="hidden" name="nanoid" value={feature.nanoid} />
            <input type="hidden" name="package" value={packageNanoid} />
            <input type="hidden" name="product" value={product} />
            <input type="hidden" name="workspace" value={workspace} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              disabled={isLast}
              className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              aria-label={`Move ${feature.name} down`}
            >
              <ChevronDown className="size-4" />
            </button>
          </form>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded-sm p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={`Actions for ${feature.name}`}
            >
              <MoreVertical className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36 p-1">
            <DropdownMenuItem
              className="py-1 text-xs"
              onSelect={() => setEditOpen(true)}
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="py-1 text-xs text-destructive focus:text-destructive"
              onSelect={() => setDeleteOpen(true)}
            >
              Delete
            </DropdownMenuItem>
            <DropdownMenuItem
              className="py-1 text-xs"
              disabled={isFirst || moving}
              onSelect={() => handleMove("up")}
            >
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem
              className="py-1 text-xs"
              disabled={isLast || moving}
              onSelect={() => handleMove("down")}
            >
              Move down
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <FeatureEditDialog
        feature={feature}
        raw={raw}
        workspace={workspace}
        product={product}
        featureGroups={featureGroups}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove feature?"
        description={`Remove "${feature.name}" from this package. The feature itself is not deleted.`}
        confirmLabel="Remove"
        variant="destructive"
        confirming={deleting}
        onConfirm={handleDelete}
      />
    </li>
  );
}

function FeatureEditDialog({
  feature,
  raw,
  workspace,
  product,
  featureGroups,
  open,
  onOpenChange,
}: {
  feature: ProductPricingFeature;
  raw: PackageFeature | null;
  workspace: string;
  product: string;
  featureGroups: { nanoid: string; name: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateFeatureAction,
    initialFeatureState,
  );

  useEffect(() => {
    if (state.status === "success") onOpenChange(false);
  }, [state.status, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit feature</DialogTitle>
          <DialogDescription>Modify the feature text or settings.</DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <input type="hidden" name="nanoid" value={feature.nanoid} />
          <input type="hidden" name="workspace" value={workspace} />
          <input type="hidden" name="product" value={product} />

          <div className="space-y-1">
            <Label htmlFor={`feature-name-${feature.nanoid}`}>Feature text</Label>
            <Input
              id={`feature-name-${feature.nanoid}`}
              name="name"
              defaultValue={raw?.name ?? feature.name}
              required
            />
            {state.fieldErrors?.name ? (
              <p className="text-xs text-red-600">
                {state.fieldErrors.name.join(" ")}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <Label htmlFor={`group-${feature.nanoid}`}>Feature group</Label>
            <select
              id={`group-${feature.nanoid}`}
              name="group"
              defaultValue={raw?.group ?? ""}
              className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
            >
              <option value="">No group</option>
              {featureGroups.map((g) => (
                <option key={g.nanoid} value={g.nanoid}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id={`bolded-${feature.nanoid}`}
              name="bolded"
              type="checkbox"
              defaultChecked={raw?.bolded ?? false}
              value="on"
            />
            <Label htmlFor={`bolded-${feature.nanoid}`}>Bolded</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`basic-${feature.nanoid}`}>Basic USD value</Label>
              <Input
                id={`basic-${feature.nanoid}`}
                name="basic_usd_value"
                type="number"
                step="0.01"
                defaultValue={
                  raw?.basic_usd_value ? Number(raw.basic_usd_value) : ""
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`kenyan-${feature.nanoid}`}>Kenyan price value</Label>
              <Input
                id={`kenyan-${feature.nanoid}`}
                name="kenyan_price_value"
                type="number"
                step="0.01"
                defaultValue={
                  raw?.kenyan_price_value ? Number(raw.kenyan_price_value) : ""
                }
              />
            </div>
          </div>

          {state.status === "error" && state.message ? (
            <p className="text-xs text-red-600">{state.message}</p>
          ) : null}
          {state.status === "success" && state.message ? (
            <p className="text-xs text-green-600">{state.message}</p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="destructive"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
