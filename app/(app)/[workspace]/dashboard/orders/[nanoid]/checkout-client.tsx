"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { type ClientBusiness, type Order, type SubsPlan } from "@/lib/api";
import { updateOrderItemQuantity } from "./actions";
import { MIN_QTY, MAX_QTY } from "./_components/constants";
import { ReviewPanel } from "./_components/review-panel";
import { TotalCard } from "./_components/total-card";

export function CheckoutClient({
  order,
  plan,
  workspaceDomain,
  organization,
}: {
  order: Order;
  plan: SubsPlan;
  workspaceDomain: string;
  organization: ClientBusiness;
}) {
  const router = useRouter();

  const chargeable = useMemo(() => order.items ?? [], [order.items]);

  const [kept, setKept] = useState<Set<string>>(
    () => new Set(chargeable.map((item) => item.nanoid)),
  );
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      chargeable.map((item) => [item.nanoid, Number(item.quantity ?? 1)]),
    ),
  );
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [qtyErrors, setQtyErrors] = useState<Record<string, string | null>>({});

  const keptItems = useMemo(
    () => chargeable.filter((item) => kept.has(item.nanoid)),
    [chargeable, kept],
  );
  const knockedCount = chargeable.length - keptItems.length;

  const monthlyTotal = useMemo(
    () =>
      keptItems.reduce(
        (sum, item) =>
          sum +
          Number(item.unit_price ?? 0) * (quantities[item.nanoid] ?? 1),
        0,
      ),
    [keptItems, quantities],
  );

  const toggle = (nanoid: string) => {
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(nanoid)) next.delete(nanoid);
      else next.add(nanoid);
      return next;
    });
  };

  const reset = () => {
    setKept(new Set(chargeable.map((item) => item.nanoid)));
    setQtyErrors({});
  };

  const applyQuantity = (nanoid: string, quantity: number) => {
    const next = Math.max(MIN_QTY, Math.min(MAX_QTY, Math.round(quantity)));
    const previous = quantities[nanoid];
    if (next === previous) return;

    setQtyErrors((prev) => ({ ...prev, [nanoid]: null }));
    setQuantities((prev) => ({ ...prev, [nanoid]: next }));
    setBusy((prev) => ({ ...prev, [nanoid]: true }));

    void updateOrderItemQuantity({
      nanoid,
      quantity: next,
      workspace: workspaceDomain,
      orderNanoid: order.nanoid,
    }).then((result) => {
      setBusy((prev) => ({ ...prev, [nanoid]: false }));
      if (!result.ok) {
        setQuantities((prev) => ({ ...prev, [nanoid]: previous }));
        setQtyErrors((prev) => ({
          ...prev,
          [nanoid]: result.message ?? "Could not update this line.",
        }));
      }
    });
  };

  const handleContinue = () => {
    const picked = keptItems.map((item) => item.nanoid).join(",");
    router.push(
      `/${workspaceDomain}/dashboard/orders/${order.nanoid}/confirm?items=${encodeURIComponent(picked)}`,
    );
  };

  return (
    <div className="mx-auto w-full max-w-5xl py-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <ReviewPanel
              chargeable={chargeable}
              kept={kept}
              quantities={quantities}
              busy={busy}
              qtyErrors={qtyErrors}
              knockedCount={knockedCount}
              onToggle={toggle}
              onReset={reset}
              onQuantityChange={applyQuantity}
              plan={plan}
            />
          </section>

          <aside className="space-y-5 lg:col-span-5 lg:sticky lg:top-6">
            <TotalCard
              keptCount={keptItems.length}
              knockedCount={knockedCount}
              totalDue={monthlyTotal}
              onContinue={handleContinue}
              organizationName={organization.legal_name}
              planLabel={plan.label}
            />
          </aside>
        </div>
    </div>
  );
}