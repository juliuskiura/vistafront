"use client";

import { useState, useTransition } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  updatePackageAction,
  type PackageActionState,
} from "./actions";
import type { ProductPackage, ProductPricingPackage } from "@/lib/api";

const initialState: PackageActionState = { status: "idle" };

export function PackageCard({
  pkg,
  raw,
  workspace,
  product,
}: {
  pkg: ProductPricingPackage;
  raw: ProductPackage | null;
  workspace: string;
  product: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updatePackageAction,
    initialState,
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
      <p className="mt-1 text-xs text-muted-foreground">{pkg.period}</p>
      {pkg.description ? (
        <p className="mt-3 text-sm text-muted-foreground">{pkg.description}</p>
      ) : null}
      {pkg.promise ? (
        <p className="mt-2 text-sm">{String(pkg.promise)}</p>
      ) : null}
      {Array.isArray(pkg.features) && pkg.features.length > 0 ? (
        <ul className="mt-4 space-y-1 text-sm">
          {pkg.features.map((feature) => (
            <li key={feature.nanoid} className="flex items-start gap-2">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{feature.name}</span>
            </li>
          ))}
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
          <DialogContent>
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
                    defaultValue={raw?.kenyan_price ? Number(raw.kenyan_price) : ""}
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

              {state.status === "error" && state.message ? (
                <p className="text-xs text-red-600">{state.message}</p>
              ) : null}
              {state.status === "success" && state.message ? (
                <p className="text-xs text-green-600">{state.message}</p>
              ) : null}

              <DialogFooter>
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
