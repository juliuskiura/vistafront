"use client";

import { Check, CreditCard, ShieldCheck, Smartphone } from "@/lib/icons";
import { VisaLogo, MpesaLogo, PaypalLogo } from "./brand-logos";

export type PaymentMethodId = "visa" | "mpesa" | "paypal";

interface MethodConfig {
  id: PaymentMethodId;
  name: string;
  subtitle: string;
  badge?: string;
  badgeType?: "primary" | "success" | "secondary";
  logo: React.ReactNode;
  hint: string;
}

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethodId;
  onSelect: (method: PaymentMethodId) => void;
}

export function PaymentMethodSelector({
  selectedMethod,
  onSelect,
}: PaymentMethodSelectorProps) {
  const methods: MethodConfig[] = [
    {
      id: "visa",
      name: "Visa",
      subtitle: "Credit & Debit Cards",
      badge: "Zero Liability",
      badgeType: "primary",
      logo: <VisaLogo className="h-5 w-auto" />,
      hint: "Global standard • 3D Secure 2.0",
    },
    {
      id: "mpesa",
      name: "M-PESA",
      subtitle: "Lipa na M-PESA",
      badge: "Instant",
      badgeType: "success",
      logo: <MpesaLogo className="h-5 w-auto" />,
      hint: "Kenya & East Africa • Direct PIN prompt",
    },
    {
      id: "paypal",
      name: "PayPal",
      subtitle: "Wallet & Pay in 4",
      badge: "Buyer Protection",
      badgeType: "secondary",
      logo: <PaypalLogo className="h-5 w-auto" />,
      hint: "One-click checkout • Split in 4",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <CreditCard className="w-3.5 h-3.5" />
          <span>Select Payment Method</span>
        </span>
        <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-primary-400" />
          Bank-Grade Security
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {methods.map((method) => {
          const isSelected = selectedMethod === method.id;
          const isMpesa = method.id === "mpesa";

          return (
            <button
              key={method.id}
              id={`payment-choice-${method.id}`}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`group relative text-left p-4 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? isMpesa
                    ? "glass-surface-green ring-2 ring-emerald-500/80 shadow-lg shadow-emerald-500/10"
                    : "glass-surface ring-2 ring-primary-500/80 shadow-lg shadow-primary-500/15"
                  : "glass-surface hover:border-primary/40 hover:-translate-y-0.5 opacity-85 hover:opacity-100"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

              <div className="flex items-center justify-between mb-3 w-full">
                <div className="flex items-center gap-2">
                  <div className="h-7 px-2.5 py-1 rounded-lg bg-card/60 border border-border/50 flex items-center justify-center backdrop-blur-sm shadow-xs">
                    {method.logo}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                    isSelected
                      ? isMpesa
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "bg-primary-500 text-white shadow-xs"
                      : "border border-border/80 bg-background/50 group-hover:border-primary/40"
                  }`}
                >
                  {isSelected && (
                    <Check className="w-3 h-3 stroke-3 checkout-fade-slide" />
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-display font-semibold text-base text-foreground tracking-tight">
                    {method.name}
                  </span>
                  {method.badge && (
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.2 rounded-md ${
                        method.badgeType === "success"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : method.badgeType === "secondary"
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                            : "bg-primary-500/15 text-primary-600 dark:text-primary-300 border border-primary-500/20"
                      }`}
                    >
                      {method.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {method.subtitle}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border/40 text-[11px] text-muted-foreground/90 flex items-center justify-between">
                <span>{method.hint}</span>
                {method.id === "mpesa" && (
                  <Smartphone className="w-3.5 h-3.5 opacity-60" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}