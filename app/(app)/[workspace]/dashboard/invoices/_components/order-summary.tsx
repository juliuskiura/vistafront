"use client";

import { useState } from "react";
import { Award, Check, Lock, Tag } from "@/lib/icons";
import type { CheckoutCurrency, OrderLine } from "./types";

export const EUR_PER_USD = 0.92;

export function formatPrice(
  kes: number,
  currency: CheckoutCurrency,
  usdPerKes: number = 1 / 130,
): string {
  if (currency === "KES") {
    return `KES ${kes.toLocaleString()}`;
  }
  if (currency === "EUR") {
    return `€${(kes * usdPerKes * EUR_PER_USD).toFixed(2)}`;
  }
  return `$${(kes * usdPerKes).toFixed(2)}`;
}

interface OrderSummaryProps {
  invoiceNumber: string;
  lines: OrderLine[];
  includedCount: number;
  baseKES: number;
  currency: CheckoutCurrency;
  /** Backend FX factor (USD per KES, markup included); display only. */
  usdPerKes?: number | null;
  onCurrencyChange: (curr: CheckoutCurrency) => void;
  discountPercent: number;
  onApplyPromo: (code: string) => boolean;
  promoCode: string;
}

export function OrderSummary({
  invoiceNumber,
  lines,
  includedCount,
  baseKES,
  currency,
  usdPerKes,
  onCurrencyChange,
  discountPercent,
  onApplyPromo,
  promoCode,
}: OrderSummaryProps) {
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isPromoOpen, setIsPromoOpen] = useState(false);

  const fxRate = usdPerKes ?? 1 / 130;
  const discountedKES = baseKES * (1 - discountPercent / 100);

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const success = onApplyPromo(promoInput.trim());
    if (!success) {
      setPromoError('Invalid promo code. Try "VIP20" or "GLASS"');
    } else {
      setPromoError("");
    }
  };

  const chargeLines = lines.filter((line) => line.total > 0);

  return (
    <div className="glass-surface p-5 md:p-6 rounded-2xl space-y-5 border border-border/60">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div>
          <h3 className="font-display font-bold text-base text-foreground tracking-tight">
            Order Summary
          </h3>
          <p className="text-xs text-muted-foreground">
            Invoice #{invoiceNumber}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-card/60 border border-border/50 text-[11px] font-semibold">
          {(["KES", "USD", "EUR"] as const).map((curr) => (
            <button
              key={curr}
              id={`currency-${curr}`}
              type="button"
              onClick={() => onCurrencyChange(curr)}
              className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                currency === curr
                  ? "bg-primary text-white shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {curr}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {chargeLines.map((line, idx) => (
          <div key={idx} className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-foreground">
                {line.description}
              </div>
              {(line.detail || (line.quantity ?? 1) > 1) && (
                <div className="text-[11px] text-muted-foreground">
                  {line.detail ??
                    `${line.quantity} × ${formatPrice(line.total / (line.quantity ?? 1), "KES", fxRate)}`}
                </div>
              )}
            </div>
            <span className="font-mono font-medium text-foreground shrink-0">
              {formatPrice(line.total, currency, fxRate)}
            </span>
          </div>
        ))}

        {includedCount > 0 && (
          <div className="flex items-center justify-between gap-3 text-[11px] text-muted-foreground">
            <span className="truncate">
              Included capabilities ({includedCount})
            </span>
            <span className="text-emerald-500 font-medium shrink-0">
              Included
            </span>
          </div>
        )}

        {discountPercent > 0 && (
          <div className="flex items-center justify-between text-emerald-500 font-medium pt-1">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> Promo Applied ({promoCode} -
              {discountPercent}%)
            </span>
            <span className="font-mono">
              -{formatPrice(baseKES * (discountPercent / 100), currency, fxRate)}
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border/40 pt-3">
        {!isPromoOpen && discountPercent === 0 ? (
          <button
            type="button"
            onClick={() => setIsPromoOpen(true)}
            className="text-xs text-primary hover:text-primary-400 font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Have a discount coupon?</span>
          </button>
        ) : discountPercent === 0 ? (
          <form onSubmit={handleApplyPromo} className="space-y-1.5">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter coupon (e.g. VIP20)"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  setPromoError("");
                }}
                className="glass-input flex-1 px-3 py-1.5 rounded-lg text-xs uppercase font-mono tracking-wider"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-600 transition-colors cursor-pointer"
              >
                Apply
              </button>
            </div>
            {promoError && (
              <p className="text-[11px] text-destructive">{promoError}</p>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-between text-xs text-emerald-500 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <span className="flex items-center gap-1.5 font-medium">
              <Check className="w-3.5 h-3.5" /> Code &ldquo;{promoCode}&rdquo; applied
            </span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
              {discountPercent}% saved
            </span>
          </div>
        )}
      </div>

      <div className="border-t border-border/40 pt-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Taxes & Handling (VAT included)</span>
          <span className="font-mono text-emerald-500">Included</span>
        </div>

        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="font-display font-bold text-base text-foreground">
              Total Due Today
            </span>
            <span className="block text-[10px] text-muted-foreground">
              Billed immediately in {currency}
            </span>
          </div>
          <div className="text-right">
            <div className="font-display font-extrabold text-2xl text-primary dark:text-primary-400 tracking-tight">
              {formatPrice(discountedKES, currency, fxRate)}
            </div>
            {currency !== "KES" && (
              <div className="text-[11px] text-muted-foreground font-mono">
                ~KES {Math.round(discountedKES).toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-border/40 space-y-2.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Award className="w-4 h-4 text-amber-500 shrink-0" />
          <span>30-Day money-back guarantee</span>
        </div>  
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Lock className="w-4 h-4 text-primary-400 shrink-0" />
          <span>Secure checkout transmission</span>
        </div>
      </div>
    </div>
  );
}