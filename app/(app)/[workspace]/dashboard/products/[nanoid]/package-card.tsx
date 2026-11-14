"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Pencil, Plus, XCircle } from "@/lib/icons";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  addFeatureToPackageAction,
  moveFeatureInPackageAction,
  removeFeatureFromPackageFormAction,
  updateFeatureAction,
  updatePackageAction,
  type FeatureActionState,
  type PackageActionState,
} from "./actions";
import type { PackageFeature, ProductPackage, ProductPricingPackage } from "@/lib/api";

const initialState: PackageActionState = { status: "idle" };

export function PackageCard({
  pkg,
  raw,
  rawFeatures,
  workspace,
  product,
  allFeatures,
  featureGroups,
}: {
  pkg: ProductPricingPackage;
  raw: ProductPackage | null;
  rawFeatures: PackageFeature[];
  workspace: string;
  product: string;
  allFeatures: PackageFeature[];
  featureGroups: { nanoid: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updatePackageAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state.status]);

  // The pricing serializer emits features in their package-scoped through
  // order; sort again here so the sequence survives any payload reordering.
  const orderedFeatures = [...(pkg.features ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );

  return (
    <div className="flex flex-col rounded-lg border bg-card p-6">
      {pkg.popular ? (
        <span className="mb-2 w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Popular
        </span>
      ) : null}
      <h3 className="text-base font-semibold">{pkg.name}</h3>
      <p className="mt-1 text-2xl font-bold">{pkg.price}</p>
      {raw?.kenyan_price ? (
        <p className="mt-1 text-lg font-semibold text-muted-foreground">
          Kenya: KSH {Number(raw.kenyan_price).toLocaleString()}
        </p>
      ) : (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-600">
          <XCircle className="size-3.5" />
          Kenyan price missing
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{pkg.period}</p>
      {pkg.description ? (
        <p className="mt-3 text-sm text-muted-foreground">{pkg.description}</p>
      ) : null}
      {pkg.promise ? (
        <p className="mt-2 text-sm">{String(pkg.promise)}</p>
      ) : null}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase text-muted-foreground">Features</p>
        <AddFeatureDialog
          packageNanoid={pkg.nanoid}
          assigned={pkg.features ?? []}
          allFeatures={allFeatures}
          product={product}
          workspace={workspace}
        />
      </div>
      {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm">
          {orderedFeatures.map((feature, index) => {
            const rawFeature =
              rawFeatures.find((f) => f.nanoid === feature.nanoid) ?? null;
            return (
              <li
                key={feature.nanoid}
                className="flex items-start justify-between gap-2"
              >
                <span className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span className={feature.bolded ? "font-semibold" : undefined}>{feature.order}. {feature.name}</span>
                </span>
                <div className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <form action={moveFeatureInPackageAction}>
                      <input type="hidden" name="nanoid" value={feature.nanoid} />
                      <input type="hidden" name="package" value={pkg.nanoid} />
                      <input type="hidden" name="product" value={product} />
                      <input type="hidden" name="workspace" value={workspace} />
                      <input type="hidden" name="direction" value="up" />
                      <button
                        type="submit"
                        disabled={index === 0}
                        className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Move ${feature.name} up`}
                      >
                        <ChevronUp className="size-4" />
                      </button>
                    </form>
                    <form action={moveFeatureInPackageAction}>
                      <input type="hidden" name="nanoid" value={feature.nanoid} />
                      <input type="hidden" name="package" value={pkg.nanoid} />
                      <input type="hidden" name="product" value={product} />
                      <input type="hidden" name="workspace" value={workspace} />
                      <input type="hidden" name="direction" value="down" />
                      <button
                        type="submit"
                        disabled={index === orderedFeatures.length - 1}
                        className="text-muted-foreground hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label={`Move ${feature.name} down`}
                      >
                        <ChevronDown className="size-4" />
                      </button>
                    </form>
                  </div>
                  <FeatureEditDialog
                    feature={feature}
                    raw={rawFeature}
                    workspace={workspace}
                    product={product}
                    featureGroups={featureGroups}
                  />
                  <form action={removeFeatureFromPackageFormAction}>
                    <input type="hidden" name="nanoid" value={feature.nanoid} />
                    <input type="hidden" name="package" value={pkg.nanoid} />
                    <input type="hidden" name="product" value={product} />
                    <input type="hidden" name="workspace" value={workspace} />
                    <button
                      type="submit"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove feature from package"
                    >
                      ×
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}

      {Array.isArray(pkg.operation_boundaries) && pkg.operation_boundaries.length > 0 ? (
        <div className="mt-4 space-y-1">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            Operating boundaries
          </p>
          <ul className="space-y-1 text-sm">
            {pkg.operation_boundaries.map((b, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-muted-foreground" />
                <span>{String(b)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Edit Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Edit package</DialogTitle>
              <DialogDescription>
                Modify the details for {pkg.name}.
              </DialogDescription>
            </DialogHeader>
            <form action={formAction} className="space-y-3">
              <input type="hidden" name="nanoid" value={pkg.nanoid} />
              <input type="hidden" name="product" value={product} />
              <input type="hidden" name="workspace" value={workspace} />

              <div className="space-y-1">
                <Label htmlFor={`name-${pkg.nanoid}`}>Name</Label>
                <Input
                  id={`name-${pkg.nanoid}`}
                  name="name"
                  defaultValue={pkg.name}
                  required
                />
                {state.fieldErrors?.name ? (
                  <p className="text-xs text-red-600">{state.fieldErrors.name.join(" ")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label htmlFor={`description-${pkg.nanoid}`}>Description</Label>
                <Textarea
                  id={`description-${pkg.nanoid}`}
                  name="description"
                  defaultValue={pkg.description ?? ""}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`promise-${pkg.nanoid}`}>Promise</Label>
                <Textarea
                  id={`promise-${pkg.nanoid}`}
                  name="promise"
                  defaultValue={pkg.promise ? String(pkg.promise) : ""}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor={`period-${pkg.nanoid}`}>Period</Label>
                <select
                  id={`period-${pkg.nanoid}`}
                  name="period"
                  defaultValue={pkg.period}
                  className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm"
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
                  <Label htmlFor={`intl-${pkg.nanoid}`}>International price</Label>
                  <Input
                    id={`intl-${pkg.nanoid}`}
                    name="international_price"
                    type="number"
                    step="0.01"
                    defaultValue={raw ? Number(raw.international_price) : 0}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`kenyan-${pkg.nanoid}`}>Kenyan price</Label>
                  <Input
                    id={`kenyan-${pkg.nanoid}`}
                    name="kenyan_price"
                    type="number"
                    step="0.01"
                    defaultValue={
                      raw?.kenyan_price != null && raw.kenyan_price !== ""
                        ? Number(raw.kenyan_price)
                        : ""
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id={`popular-${pkg.nanoid}`}
                  name="popular"
                  type="checkbox"
                  defaultChecked={pkg.popular}
                  value="on"
                />
                <Label htmlFor={`popular-${pkg.nanoid}`}>Popular</Label>
              </div>

              {Array.isArray(pkg.operation_boundaries) &&
              pkg.operation_boundaries.length > 0 ? (
                <div className="space-y-1">
                  <Label htmlFor={`boundaries-${pkg.nanoid}`}>
                    Operational boundaries
                  </Label>
                  <Textarea
                    id={`boundaries-${pkg.nanoid}`}
                    name="operation_boundaries"
                    defaultValue={pkg.operation_boundaries
                      .map((b) => String(b))
                      .join("\n")}
                  />
                  <p className="text-xs text-muted-foreground">
                    One boundary per line.
                  </p>
                </div>
              ) : null}

              {state.status === "error" && state.message ? (
                <p className="text-xs text-red-600">{state.message}</p>
              ) : null}
              {state.status === "success" && state.message ? (
                <p className="text-xs text-green-600">{state.message}</p>
              ) : null}

              <DialogFooter>
                <Button type="button" variant="destructive" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving..." : "Save changes"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

const initialFeatureState: FeatureActionState = { status: "idle" };

function FeatureEditDialog({
  feature,
  raw,
  workspace,
  product,
  featureGroups,
}: {
  feature: { nanoid: string; name: string };
  raw: PackageFeature | null;
  workspace: string;
  product: string;
  featureGroups: { nanoid: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateFeatureAction,
    initialFeatureState,
  );

  useEffect(() => {
    if (state.status === "success") setOpen(false);
  }, [state.status]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Edit feature"
        >
          <Pencil className="size-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
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
            <Button type="button" variant="destructive" onClick={() => setOpen(false)}>
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

function AddFeatureDialog({
  packageNanoid,
  assigned,
  allFeatures,
  product,
  workspace,
}: {
  packageNanoid: string;
  assigned: { nanoid: string }[];
  allFeatures: PackageFeature[];
  product: string;
  workspace: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const assignedIds = new Set(assigned.map((f) => f.nanoid));
  const visibleFeatures = allFeatures.filter((feature) =>
    feature.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" aria-label="Add feature to package">
          <Plus className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Add features</DialogTitle>
          <DialogDescription>
            Select features to add to this package.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Input
            placeholder="Search features..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {visibleFeatures.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {allFeatures.length === 0 ? "No features available." : "No features match your search."}
            </p>
          ) : (
            visibleFeatures.map((feature) => {
              const isAssigned = assignedIds.has(feature.nanoid);
              return (
                <div
                  key={feature.nanoid}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className={feature.bolded ? "text-sm font-semibold" : "text-sm"}>
                    {feature.name}
                  </span>
                  {isAssigned ? (
                    <Button variant="outline" size="sm" disabled>
                      Added
                    </Button>
                  ) : (
                    <form action={addFeatureToPackageAction}>
                      <input type="hidden" name="nanoid" value={feature.nanoid} />
                      <input type="hidden" name="package" value={packageNanoid} />
                      <input type="hidden" name="product" value={product} />
                      <input type="hidden" name="workspace" value={workspace} />
                      <Button type="submit" size="sm">
                        Add
                      </Button>
                    </form>
                  )}
                </div>
              );
            })
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="destructive" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
