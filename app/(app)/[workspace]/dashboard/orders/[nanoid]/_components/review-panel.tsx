import { PackageCheck, RotateCcw } from "@/lib/icons";
import type { OrderItem, SubsPlan } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { BillableItem } from "./billable-item";

export function ReviewPanel({
  chargeable,
  kept,
  quantities,
  busy,
  qtyErrors,
  knockedCount,
  onToggle,
  onReset,
  onQuantityChange,
  plan,
}: {
  chargeable: OrderItem[];
  kept: Set<string>;
  quantities: Record<string, number>;
  busy: Record<string, boolean>;
  qtyErrors: Record<string, string | null>;
  knockedCount: number;
  onToggle: (nanoid: string) => void;
  onReset: () => void;
  onQuantityChange: (nanoid: string, quantity: number) => void;
  plan: SubsPlan;
}) {
  const keptCount = kept.size;
  return (
    <Card className="rounded-xl border bg-card p-5 md:p-6">
      <div className="mb-5 flex items-center gap-2">
        <PackageCheck className="h-4 w-4 text-primary" />
        <h2 className="font-semibold text-sm text-foreground">Order Summary</h2>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {keptCount} {keptCount === 1 ? "item" : "items"}
        </span>
        {knockedCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border/70 px-2 py-0.5 text-[10px] uppercase font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      {chargeable.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground">
          This order has no billable lines yet.
        </p>
      ) : (
        <div className="space-y-3">
          {chargeable.map((item) => (
            <BillableItem
              key={item.nanoid}
              item={item}
              plan={item.product?.type === "subsplan" ? plan : undefined}
              quantity={quantities[item.nanoid] ?? item.quantity}
              included={kept.has(item.nanoid)}
              busy={busy[item.nanoid] ?? false}
              qtyError={qtyErrors[item.nanoid] ?? null}
              onToggle={() => onToggle(item.nanoid)}
              onQuantityChange={(q) => onQuantityChange(item.nanoid, q)}
            />
          ))}
        </div>
      )}
    </Card>
  );
}