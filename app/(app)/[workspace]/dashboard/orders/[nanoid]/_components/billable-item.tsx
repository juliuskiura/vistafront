"use client";

import { useState } from "react";

import type { OrderItem, SubsPlan } from "@/lib/api";
import { cn } from "@/lib/utils";
import { resolveCapabilityStyle } from "@/lib/icon-maps";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader,
  Minus,
  Plus,
  Sparkles,
  X,
  Zap,
} from "@/lib/icons";
import { formatPrice } from "./format";
import { MAX_QTY, MIN_QTY } from "./constants";

const fmt = (n: number) => formatPrice(n, "KES");

function PlanThumb() {
  return (
    <div className="relative shrink-0">
      <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-secondary-600 shadow-sm">
        <Sparkles className="h-6 w-6 text-white" />
      </div>
      <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-white shadow-sm">
        <Zap className="h-3.5 w-3.5 text-primary" />
      </span>
    </div>
  );
}

function FeatureChips({ plan }: { plan: SubsPlan }) {
  const features = plan.features ?? [];
  const [open, setOpen] = useState(false);
  const preview = features.slice(0, 2);
  const extra = features.length - preview.length;

  return (
    <div className="mt-2">
      {!open ? (
        <div className="flex flex-wrap items-center gap-1">
          {preview.map((feature) => (
            <span
              key={feature.nanoid}
              className="inline-flex items-center gap-1 rounded-full bg-border/40 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
            >
              <Check className="h-2.5 w-2.5 text-emerald-500" />
              {feature.label || feature.feature}
            </span>
          ))}
          {extra > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-border/70 px-2 py-0.5 text-[10px] font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              …{extra} more
              <ChevronDown className="h-3 w-3" strokeWidth={2.5} />
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2 rounded-xl border border-border/70 bg-muted/30 p-3">
          {features.map((feature) => {
            const { icon: Icon, iconBg, iconColor } = resolveCapabilityStyle(
              feature.feature,
            );
            return (
              <div key={feature.nanoid} className="flex items-start gap-2 text-xs">
                <span
                  className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    iconBg,
                  )}
                >
                  <Icon className={cn("h-3 w-3", iconColor)} />
                </span>
                <div>
                  <p className="font-semibold text-foreground">
                    {feature.label || feature.feature}
                  </p>
                  {feature.description && (
                    <p className="text-[11px] text-muted-foreground">
                      {feature.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary transition-colors hover:text-primary-500"
          >
            <ChevronUp className="h-3 w-3" strokeWidth={2.5} />
            Show less
          </button>
        </div>
      )}
    </div>
  );
}

export function BillableItem({
  item,
  plan,
  quantity,
  busy,
  removing,
  qtyError,
  onRemove,
  onQuantityChange,
}: {
  item: OrderItem;
  plan?: SubsPlan;
  quantity: number;
  busy: boolean;
  removing?: boolean;
  qtyError?: string | null;
  onRemove: () => void;
  onQuantityChange: (quantity: number) => void;
}) {
  const unit = Number(item.unit_price ?? 0);
  const currentQty = Math.max(MIN_QTY, Math.round(Number(quantity ?? 1)));
  const isPlan = item.product?.type === "subsplan";
  const subtitle = isPlan
    ? plan?.description
    : (item.product?.type
        ? item.product.type[0].toUpperCase() + item.product.type.slice(1)
        : null) ?? "Add-on line";

  return (
    <div className="rounded-xl border border-border bg-card transition-all">
      <div className="p-4 md:p-5">
        <div className="flex gap-4">
          <PlanThumb />

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">
                  {item.description}
                </p>
                {subtitle && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {subtitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onRemove}
                disabled={removing || busy}
                aria-label={`Remove ${item.description} from this order`}
                className={cn(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors",
                  "border-border/70 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive",
                )}
              >
                {removing ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </div>

            {isPlan && plan && (plan.features?.length ?? 0) > 0 && (
              <FeatureChips plan={plan} />
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 border-t border-border/60 pt-3">
          <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() =>
                onQuantityChange(Math.max(MIN_QTY, currentQty - 1))
              }
              disabled={busy || currentQty <= MIN_QTY}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-9 text-center text-sm font-bold text-foreground">
              {currentQty}
            </span>
            <button
              type="button"
              onClick={() =>
                onQuantityChange(Math.min(MAX_QTY, currentQty + 1))
              }
              disabled={busy || currentQty >= MAX_QTY}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex shrink-0 flex-col items-end">
            <span className="font-display text-lg font-extrabold text-foreground">
              {fmt(unit * currentQty)}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {currentQty > 1 ? `${fmt(unit)} × ${currentQty} mo` : "per month"}
            </span>
          </div>
        </div>

        {qtyError && (
          <p className="mt-2 text-[11px] font-medium text-destructive">
            {qtyError}
          </p>
        )}
      </div>
    </div>
  );
}