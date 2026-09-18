import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PlanFieldDefaults {
  name: string;
  label: string;
  description: string;
  order: number;
  price: string;
  is_active: boolean;
}

interface PlanFieldsProps {
  editing: boolean;
  defaults: PlanFieldDefaults;
  errors?: Record<string, string[]>;
  formError?: string | null;
  pending: boolean;
  submitLabel: string;
  submitPendingLabel: string;
  onCancel: () => void;
  /** Render extra hidden inputs (e.g. the plan `nanoid`) before the fields. */
  children?: ReactNode;
}

export function PlanFields({
  editing,
  defaults,
  errors = {},
  formError = null,
  pending,
  submitLabel,
  submitPendingLabel,
  onCancel,
  children,
}: PlanFieldsProps) {
  return (
    <>
      {children}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Plan name</Label>
          <Input
            id="name"
            name="name"
            placeholder="e.g. Growth"
            defaultValue={defaults.name}
            aria-invalid={!!errors.name}
            autoFocus={!editing}
          />
          {errors.name?.[0] ? (
            <p className="text-xs text-destructive">{errors.name[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="label">Label</Label>
          <Input
            id="label"
            name="label"
            placeholder="e.g. For growing teams"
            defaultValue={defaults.label}
            aria-invalid={!!errors.label}
          />
          {errors.label?.[0] ? (
            <p className="text-xs text-destructive">{errors.label[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          name="description"
          placeholder="Short summary shown on the plan card"
          defaultValue={defaults.description}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="order">Display order</Label>
          <Input
            id="order"
            name="order"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={defaults.order}
            aria-invalid={!!errors.order}
          />
          {errors.order?.[0] ? (
            <p className="text-xs text-destructive">{errors.order[0]}</p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (Ksh / month)</Label>
          <Input
            id="price"
            name="price"
            type="text"
            inputMode="decimal"
            placeholder="e.g. 2500 — empty for custom"
            defaultValue={defaults.price}
            aria-invalid={!!errors.price}
          />
          {errors.price?.[0] ? (
            <p className="text-xs text-destructive">{errors.price[0]}</p>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3">
          <input type="hidden" name="is_active" value="off" />
          <input
            type="checkbox"
            name="is_active"
            value="on"
            defaultChecked={defaults.is_active}
            className="size-4 rounded border-input"
          />
          <span className="text-sm font-medium">
            Active (visible to customers)
          </span>
        </label>
      </div>

      {formError ? (
        <div
          role="alert"
          className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {formError}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? submitPendingLabel : submitLabel}
        </Button>
      </div>
    </>
  );
}