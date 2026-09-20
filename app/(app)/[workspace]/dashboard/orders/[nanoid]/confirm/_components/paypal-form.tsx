"use client";

import { PaypalFormData } from "./types";
import { PaypalLogo } from "./brand-logos";
import { ArrowUpRight, HelpCircle, ShieldCheck, Zap } from "@/lib/icons";

interface PaypalFormProps {
  formData: PaypalFormData;
  onChange: (data: PaypalFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
  amountUSD: number;
}

export function PaypalForm({
  formData,
  onChange,
  onSubmit,
  isProcessing,
  amountUSD,
}: PaypalFormProps) {
  const installmentAmount = (amountUSD / 4).toFixed(2);

  return (
    <form id="paypal-payment-form" onSubmit={onSubmit} className="space-y-5">
      <div className="glass-surface p-5 rounded-2xl relative overflow-hidden border border-blue-500/25">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <PaypalLogo className="h-6 w-auto" />
            </div>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            One-Touch Ready
          </span>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          Pay with your PayPal balance, linked bank account, or debit/credit
          card. Fast, encrypted, and backed by comprehensive PayPal Buyer
          Protection.
        </p>

        <div className="mt-4 p-3 rounded-xl bg-blue-500/10 dark:bg-blue-950/40 border border-blue-500/30 flex items-start gap-3">
          <div className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
            4
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-foreground">
                Pay in 4 interest-free installments
              </span>
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                ${installmentAmount} / bi-weekly
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Split into 4 payments of ${installmentAmount} every two weeks. No
              hidden fees or interest charges.
            </p>
          </div>
        </div>
      </div>

      <div>
        <label
          htmlFor="paypal-email-input"
          className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
        >
          PayPal Account Email
        </label>
        <input
          id="paypal-email-input"
          type="email"
          placeholder="your.email@domain.com"
          value={formData.email}
          onChange={(e) => onChange({ ...formData, email: e.target.value })}
          required
          className="glass-input w-full px-4 py-3 rounded-xl text-sm font-sans"
        />
        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-500" />
          <span>
            If eligible, OneTouch will bypass password re-entry automatically.
          </span>
        </p>
      </div>

      <div className="p-3 rounded-xl glass-surface space-y-2">
        <label className="flex items-start gap-3 text-xs text-foreground cursor-pointer select-none">
          <input
            id="paypal-installment-toggle"
            type="checkbox"
            checked={formData.usePayIn4}
            onChange={(e) =>
              onChange({ ...formData, usePayIn4: e.target.checked })
            }
            className="w-4 h-4 mt-0.5 rounded border-border text-blue-600 focus:ring-blue-500/40 bg-card/60"
          />
          <div>
            <span className="font-medium block">
              Enable PayPal &ldquo;Pay Later&rdquo; (Pay in 4)
            </span>
            <span className="text-[11px] text-muted-foreground block">
              First installment of ${installmentAmount} billed today upon
              approval.
            </span>
          </div>
        </label>

        <label className="flex items-center gap-3 text-xs text-muted-foreground cursor-pointer select-none pt-2 border-t border-border/40">
          <input
            id="paypal-remember-toggle"
            type="checkbox"
            checked={formData.rememberAccount}
            onChange={(e) =>
              onChange({ ...formData, rememberAccount: e.target.checked })
            }
            className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500/40 bg-card/60"
          />
          <span>Remember my PayPal account on this browser</span>
        </label>
      </div>

      <div className="glass-surface p-3 rounded-xl flex items-center gap-3 text-xs text-muted-foreground">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-foreground text-[12px]">
            PayPal Purchase Protection
          </p>
          <p className="text-[11px]">
            Covers your eligible purchases if they do not arrive or don&apos;t
            match the seller&apos;s description.
          </p>
        </div>
      </div>

      <button
        id="paypal-submit-btn"
        type="submit"
        disabled={isProcessing}
        className="w-full py-3.5 px-6 rounded-xl font-display font-semibold text-sm tracking-wide text-[#003087] bg-[#FFC439] hover:bg-[#F4B924] active:scale-[0.99] transition-all duration-200 shadow-lg shadow-amber-500/15 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 font-sans font-bold"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-[#003087]/30 border-t-[#003087] rounded-full animate-spin" />
            <span>Connecting PayPal Checkout...</span>
          </>
        ) : (
          <>
            <PaypalLogo className="h-5 w-auto" />
            <span className="text-[#003087] font-semibold">
              Checkout with PayPal
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#003087]" />
          </>
        )}
      </button>

      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
        <HelpCircle className="w-3 h-3" />
        <span>
          You&apos;ll be securely redirected to PayPal to authorize this
          payment.
        </span>
      </p>
    </form>
  );
}