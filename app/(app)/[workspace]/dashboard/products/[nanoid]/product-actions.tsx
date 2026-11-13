"use client";

import { useEffect, useState, useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createFeatureAction,
  createFeatureGroupAction,
  createPackageAction,
  createProductAction,
  updateProductAction,
  type FeatureCreateState,
  type FeatureGroupCreateState,
  type PackageCreateState,
  type ProductActionState,
} from "./actions";

const productInitial: ProductActionState = { status: "idle" };
const packageInitial: PackageCreateState = { status: "idle" };
const featureInitial: FeatureCreateState = { status: "idle" };
const featureGroupInitial: FeatureGroupCreateState = { status: "idle" };

export function ProductActions({
  product,
  workspace,
  productName,
  productDescription,
  packages,
  featureGroups,
}: {
  product: string;
  workspace: string;
  productName: string;
  productDescription: string;
  packages: { nanoid: string; name: string }[];
  featureGroups: { nanoid: string; name: string; package: string }[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [addPackageOpen, setAddPackageOpen] = useState(false);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [addFeatureOpen, setAddFeatureOpen] = useState(false);
  const [addFeatureGroupOpen, setAddFeatureGroupOpen] = useState(false);

  const [editState, editAction, editPending] = useActionState(
    updateProductAction,
    productInitial,
  );
  const [addProductState, addProductAction, addProductPending] = useActionState(
    createProductAction,
    productInitial,
  );
  const [addPackageState, addPackageAction, addPackagePending] = useActionState(
    createPackageAction,
    packageInitial,
  );
  const [addFeatureState, addFeatureAction, addFeaturePending] = useActionState(
    createFeatureAction,
    featureInitial,
  );
  const [addFeatureGroupState, addFeatureGroupAction, addFeatureGroupPending] = useActionState(
    createFeatureGroupAction,
    featureGroupInitial,
  );

  const [selectedPackage, setSelectedPackage] = useState(packages[0]?.nanoid ?? "");

  const groupsForPackage = featureGroups.filter((g) => g.package === selectedPackage);


  useEffect(() => {
    if (editState.status === "success") setEditOpen(false);
  }, [editState.status]);
  useEffect(() => {
    if (addPackageState.status === "success") setAddPackageOpen(false);
  }, [addPackageState.status]);
  useEffect(() => {
    if (addProductState.status === "success") setAddProductOpen(false);
  }, [addProductState.status]);
  useEffect(() => {
    if (addFeatureGroupState.status === "success") setAddFeatureGroupOpen(false);
  }, [addFeatureGroupState.status]);
  useEffect(() => {
    if (addFeatureState.status === "success") setAddFeatureOpen(false);
  }, [addFeatureState.status]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Edit Product Details
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Edit product details</DialogTitle>
            <DialogDescription>Update the product name and description.</DialogDescription>
          </DialogHeader>
          <form action={editAction} className="space-y-3">
            <input type="hidden" name="nanoid" value={product} />
            <input type="hidden" name="workspace" value={workspace} />
            <div className="space-y-1">
              <Label htmlFor="edit-product-name">Name</Label>
              <Input id="edit-product-name" name="name" defaultValue={productName} required />
              {editState.fieldErrors?.name ? (
                <p className="text-xs text-red-600">{editState.fieldErrors.name.join(" ")}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-product-description">Description</Label>
              <Textarea id="edit-product-description" name="description" defaultValue={productDescription} />
            </div>
            {editState.status === "error" && editState.message ? (
              <p className="text-xs text-red-600">{editState.message}</p>
            ) : null}
            {editState.status === "success" && editState.message ? (
              <p className="text-xs text-green-600">{editState.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editPending}>
                {editPending ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addPackageOpen} onOpenChange={setAddPackageOpen}>
        <DialogTrigger asChild>
          <Button size="sm">Add Package</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add package</DialogTitle>
            <DialogDescription>Create a new package for this product.</DialogDescription>
          </DialogHeader>
          <form action={addPackageAction} className="space-y-3">
            <input type="hidden" name="workspace" value={workspace} />
            <input type="hidden" name="product" value={product} />
            <div className="space-y-1">
              <Label htmlFor="add-package-name">Name</Label>
              <Input id="add-package-name" name="name" required />
              {addPackageState.fieldErrors?.name ? (
                <p className="text-xs text-red-600">{addPackageState.fieldErrors.name.join(" ")}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-package-period">Period</Label>
              <select
                id="add-package-period"
                name="period"
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                defaultValue="month"
              >
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="project_based">Project Based</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-package-price">International price</Label>
                <Input
                  id="add-package-price"
                  name="international_price"
                  type="number"
                  step="0.01"
                  required
                />
                {addPackageState.fieldErrors?.international_price ? (
                  <p className="text-xs text-red-600">{addPackageState.fieldErrors.international_price.join(" ")}</p>
                ) : null}
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-package-kenyan">Kenyan price</Label>
                <Input
                  id="add-package-kenyan"
                  name="kenyan_price"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-package-description">Description</Label>
              <Textarea id="add-package-description" name="description" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-package-promise">Promise</Label>
              <Textarea id="add-package-promise" name="promise" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-package-boundaries">Operational boundaries (one per line)</Label>
              <Textarea id="add-package-boundaries" name="operation_boundaries" />
            </div>
            <div className="flex items-center gap-2">
              <input id="add-package-popular" name="popular" type="checkbox" value="on" />
              <Label htmlFor="add-package-popular">Popular</Label>
            </div>
            {addPackageState.status === "error" && addPackageState.message ? (
              <p className="text-xs text-red-600">{addPackageState.message}</p>
            ) : null}
            {addPackageState.status === "success" && addPackageState.message ? (
              <p className="text-xs text-green-600">{addPackageState.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => setAddPackageOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addPackagePending}>
                {addPackagePending ? "Saving..." : "Create package"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addProductOpen} onOpenChange={setAddProductOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Add Product
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add product</DialogTitle>
            <DialogDescription>Create a new product.</DialogDescription>
          </DialogHeader>
          <form action={addProductAction} className="space-y-3">
            <input type="hidden" name="workspace" value={workspace} />
            <div className="space-y-1">
              <Label htmlFor="add-product-name">Name</Label>
              <Input id="add-product-name" name="name" required />
              {addProductState.fieldErrors?.name ? (
                <p className="text-xs text-red-600">{addProductState.fieldErrors.name.join(" ")}</p>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-product-description">Description</Label>
              <Textarea id="add-product-description" name="description" />
            </div>
            {addProductState.status === "error" && addProductState.message ? (
              <p className="text-xs text-red-600">{addProductState.message}</p>
            ) : null}
            {addProductState.status === "success" && addProductState.message ? (
              <p className="text-xs text-green-600">{addProductState.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => setAddProductOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addProductPending}>
                {addProductPending ? "Saving..." : "Create product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addFeatureGroupOpen} onOpenChange={setAddFeatureGroupOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Add Feature Group
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add feature group</DialogTitle>
            <DialogDescription>Create a new feature group for a package.</DialogDescription>
          </DialogHeader>
          <form action={addFeatureGroupAction} className="space-y-3">
            <input type="hidden" name="workspace" value={workspace} />
            <input type="hidden" name="product" value={product} />
            <div className="space-y-1">
              <Label htmlFor="add-feature-group-package">Package</Label>
              <select
                id="add-feature-group-package"
                name="package"
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                defaultValue={packages[0]?.nanoid ?? ""}
              >
                {packages.map((pkg) => (
                  <option key={pkg.nanoid} value={pkg.nanoid}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-feature-group-name">Name</Label>
              <Input id="add-feature-group-name" name="name" required />
              {addFeatureGroupState.fieldErrors?.name ? (
                <p className="text-xs text-red-600">{addFeatureGroupState.fieldErrors.name.join(" ")}</p>
              ) : null}
            </div>
            {addFeatureGroupState.status === "error" && addFeatureGroupState.message ? (
              <p className="text-xs text-red-600">{addFeatureGroupState.message}</p>
            ) : null}
            {addFeatureGroupState.status === "success" && addFeatureGroupState.message ? (
              <p className="text-xs text-green-600">{addFeatureGroupState.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => setAddFeatureGroupOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addFeatureGroupPending}>
                {addFeatureGroupPending ? "Saving..." : "Create feature group"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={addFeatureOpen} onOpenChange={setAddFeatureOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            Add Feature
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Add feature</DialogTitle>
            <DialogDescription>Add a feature to a package.</DialogDescription>
          </DialogHeader>
          <form action={addFeatureAction} className="space-y-3">
            <input type="hidden" name="workspace" value={workspace} />
            <input type="hidden" name="product" value={product} />
            <div className="space-y-1">
              <Label htmlFor="add-feature-package">Package</Label>
              <select
                id="add-feature-package"
                name="package"
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                defaultValue={packages[0]?.nanoid ?? ""}
                onChange={(e) => setSelectedPackage(e.target.value)}
              >
                {packages.map((pkg) => (
                  <option key={pkg.nanoid} value={pkg.nanoid}>
                    {pkg.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-feature-group">Feature group</Label>
              <select
                id="add-feature-group"
                name="group"
                className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
                defaultValue=""
              >
                <option value="">No group</option>
                {groupsForPackage.map((g) => (
                  <option key={g.nanoid} value={g.nanoid}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="add-feature-name">Feature text</Label>
              <Input id="add-feature-name" name="name" required />
              {addFeatureState.fieldErrors?.name ? (
                <p className="text-xs text-red-600">{addFeatureState.fieldErrors.name.join(" ")}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="add-feature-basic">Basic USD value</Label>
                <Input
                  id="add-feature-basic"
                  name="basic_usd_value"
                  type="number"
                  step="0.01"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="add-feature-kenyan">Kenyan price value</Label>
                <Input
                  id="add-feature-kenyan"
                  name="kenyan_price_value"
                  type="number"
                  step="0.01"
                />
              </div>
            </div>
            {addFeatureState.status === "error" && addFeatureState.message ? (
              <p className="text-xs text-red-600">{addFeatureState.message}</p>
            ) : null}
            {addFeatureState.status === "success" && addFeatureState.message ? (
              <p className="text-xs text-green-600">{addFeatureState.message}</p>
            ) : null}
            <DialogFooter>
              <Button type="button" variant="destructive" onClick={() => setAddFeatureOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={addFeaturePending}>
                {addFeaturePending ? "Saving..." : "Create feature"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
