"use client";

import { useMemo, useState, useTransition } from "react";

import { type ClientBusiness, type Order, type SubsPlan } from "@/lib/api";
import { confirmOrder, removeOrderItem, updateOrderItemQuantity } from "./actions";
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
  const chargeable = useMemo(() => order.items ?? [], [order.items]);

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      chargeable.map((item) => [item.nanoid, Number(item.quantity ?? 1)]),
    ),
  );
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [removing, setRemoving] = useState<Record<string, boolean>>({});
  const [qtyErrors, setQtyErrors] = useState<Record<string, string | null>>({});
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isConfirming, startConfirm] = useTransition();

  const totalDue = useMemo(() => {
    if (order.total != null && Number(order.total) > 0) {
      return Number(order.total);
    }
    return chargeable.reduce(
      (sum, item) => sum + Number(item.amount ?? 0),
      0,
    );
  }, [order.total, chargeable]);

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

  const remove = (nanoid: string) => {
    setConfirmError(null);
    setRemoving((prev) => ({ ...prev, [nanoid]: true }));
    void removeOrderItem({
      nanoid,
      workspace: workspaceDomain,
      orderNanoid: order.nanoid,
    }).then((result) => {
      setRemoving((prev) => ({ ...prev, [nanoid]: false }));
      if (!result.ok) {
        setConfirmError(
          result.message ?? "Could not remove this line. Please try again.",
        );
      }
    });
  };

  const handleConfirm = () => {
    setConfirmError(null);
    startConfirm(() => {
      void confirmOrder({
        orderNanoid: order.nanoid,
        workspace: workspaceDomain,
      });
    });
  };

  return (
    <div className="mx-auto w-full max-w-5xl py-6">
      {confirmError && (
        <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {confirmError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <ReviewPanel
            chargeable={chargeable}
            quantities={quantities}
            busy={busy}
            removing={removing}
            qtyErrors={qtyErrors}
            onRemove={remove}
            onQuantityChange={applyQuantity}
            plan={plan}
          />
        </section>

        <aside className="space-y-5 lg:col-span-5 lg:sticky lg:top-6">
          <TotalCard
            itemCount={chargeable.length}
            totalDue={totalDue}
            confirming={isConfirming}
            onConfirm={handleConfirm}
            organizationName={organization.legal_name}
            planLabel={plan.label}
          />
        </aside>
      </div>
    </div>
  );
}