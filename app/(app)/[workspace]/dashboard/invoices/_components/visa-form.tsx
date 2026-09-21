"use client";

import { useState } from "react";
import { CardFormData } from "./types";
import { ChipIcon, ContactlessWave, VisaLogo } from "./brand-logos";
import { CreditCard, Info, Lock, Shield } from "@/lib/icons";

interface VisaFormProps {
  formData: CardFormData;
  onChange: (data: CardFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
  amountFormatted: string;
  invoiceNumber: string;
}

export function VisaForm({
  formData,
  onChange,
  onSubmit,
  isProcessing,
  amountFormatted,
  invoiceNumber,
}: VisaFormProps) {
  const [showCvvHint, setShowCvvHint] = useState(false);

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
    onChange({ ...formData, cardNumber: formatted });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (val.length >= 2) {
      val = val.slice(0, 2) + "/" + val.slice(2);
    }
    const parts = val.split("/");
    onChange({
      ...formData,
      expiryMonth: parts[0] || "",
      expiryYear: parts[1] || "",
    });
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    onChange({ ...formData, cvv: val });
  };

  const rawCardDigits = formData.cardNumber.replace(/\s/g, "");
  const displayCardNumber = formData.cardNumber || "•••• •••• •••• ••••";
  const displayHolder = formData.cardHolder.toUpperCase() || "YOUR NAME";
  const displayExpiry =
    formData.expiryMonth && formData.expiryYear
      ? `${formData.expiryMonth}/${formData.expiryYear}`
      : "MM/YY";

  return (
    <form id="visa-payment-form" onSubmit={onSubmit} className="space-y-6">
      <div className="relative w-full aspect-[1.586/1] max-w-md mx-auto rounded-2xl p-5 md:p-6 overflow-hidden transition-transform duration-500 hover:scale-[1.01] shadow-2xl border border-white/25">
        <div className="absolute inset-0 bg-gradient-to-tr from-[#140b34] via-[#241065] to-[#3f00ff]/70 opacity-95" />
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-primary-400/30 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-16 w-60 h-60 rounded-full bg-blue-500/20 blur-2xl pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/40 pointer-events-none" />
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12" />

        <div className="relative z-10 h-full flex flex-col justify-between text-white select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChipIcon className="w-10 h-8 drop-shadow-md" />
              <ContactlessWave className="w-5 h-5 text-white/80" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-white/70">
                PLATINUM
              </span>
              <VisaLogo className="h-6 w-auto drop-shadow-md" variant="white" />
            </div>
          </div>

          <div className="my-auto py-2">
            <div className="font-mono text-lg md:text-2xl font-semibold tracking-wider text-white drop-shadow-sm">
              {displayCardNumber}
            </div>
            <div className="text-[10px] text-white/60 tracking-wider mt-1">
              4000 VALID GLOBALLY
            </div>
          </div>

          <div className="flex items-end justify-between text-xs tracking-wider">
            <div>
              <span className="block text-[9px] uppercase tracking-widest text-white/60 font-medium">
                Card Holder
              </span>
              <span className="font-medium tracking-wide text-sm drop-shadow-xs">
                {displayHolder}
              </span>
            </div>
            <div className="text-right">
              <span className="block text-[9px] uppercase tracking-widest text-white/60 font-medium">
                Expires
              </span>
              <span className="font-mono text-sm font-medium drop-shadow-xs">
                {displayExpiry}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="card-number-input"
            className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
          >
            Card Number
          </label>
          <div className="relative">
            <input
              id="card-number-input"
              type="text"
              inputMode="numeric"
              placeholder="4000 1234 5678 9010"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              required
              className="glass-input w-full px-4 py-3 pl-11 rounded-xl font-mono text-sm tracking-wide"
            />
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <VisaLogo className="h-4 w-auto" />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="card-holder-input"
            className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
          >
            Cardholder Name
          </label>
          <input
            id="card-holder-input"
            type="text"
            placeholder="Alex M. Vance"
            value={formData.cardHolder}
            onChange={(e) =>
              onChange({ ...formData, cardHolder: e.target.value })
            }
            required
            className="glass-input w-full px-4 py-3 rounded-xl text-sm capitalize"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="card-expiry-input"
              className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
            >
              Expiration Date
            </label>
            <input
              id="card-expiry-input"
              type="text"
              inputMode="numeric"
              placeholder="MM/YY"
              value={
                formData.expiryMonth && formData.expiryYear
                  ? `${formData.expiryMonth}/${formData.expiryYear}`
                  : formData.expiryMonth
              }
              onChange={handleExpiryChange}
              required
              className="glass-input w-full px-4 py-3 rounded-xl font-mono text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="card-cvv-input"
                className="text-xs font-semibold text-foreground/90 uppercase tracking-wider"
              >
                Security Code (CVV)
              </label>
              <button
                type="button"
                onClick={() => setShowCvvHint(!showCvvHint)}
                className="text-muted-foreground hover:text-foreground text-[11px] flex items-center gap-0.5"
              >
                <Info className="w-3 h-3" />
                <span>3 digits</span>
              </button>
            </div>
            <input
              id="card-cvv-input"
              type="password"
              inputMode="numeric"
              placeholder="•••"
              maxLength={4}
              value={formData.cvv}
              onChange={handleCvvChange}
              required
              className="glass-input w-full px-4 py-3 rounded-xl font-mono text-sm tracking-widest"
            />
            {showCvvHint && (
              <p className="text-[11px] text-muted-foreground mt-1 bg-muted/40 p-2 rounded-lg border border-border/50 checkout-fade-slide">
                The 3-digit CVV number is printed on the signature strip on the
                back of your Visa card.
              </p>
            )}
          </div>
        </div>

        <div className="pt-1">
          <label className="flex items-center gap-3 text-xs text-muted-foreground cursor-pointer select-none">
            <input
              id="save-card-toggle"
              type="checkbox"
              checked={formData.saveCard}
              onChange={(e) =>
                onChange({ ...formData, saveCard: e.target.checked })
              }
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary/40 bg-card/60"
            />
            <span>
              Remember this card for faster 1-click renewals (tokenized &
              PCI-DSS certified)
            </span>
          </label>
        </div>
      </div>

      <div>
        <label
          htmlFor="visa-invoice-input"
          className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
        >
          Invoice Number
        </label>
        <input
          id="visa-invoice-input"
          type="text"
          readOnly
          value={invoiceNumber}
          className="glass-input w-full px-4 py-3 rounded-xl font-mono text-xs opacity-80 cursor-not-allowed bg-card/40"
        />
      </div>

      <div className="glass-surface p-3 rounded-xl flex items-center gap-3 text-xs text-muted-foreground">
        <div className="w-8 h-8 rounded-lg bg-primary-500/10 text-primary-400 flex items-center justify-center shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div>
          <p className="font-medium text-foreground text-[12px]">
            Encrypted with 256-bit TLS & Visa Secure
          </p>
          <p className="text-[11px]">
            Your card details are never stored on our servers and are tokenized
            directly through Visa 3D-Secure 2.0.
          </p>
        </div>
      </div>

      <button
        id="visa-submit-btn"
        type="submit"
        disabled={isProcessing || rawCardDigits.length < 12}
        className="w-full py-3.5 px-6 rounded-xl font-display font-semibold text-sm tracking-wide text-white bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 hover:from-primary-500 hover:to-primary-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Authorizing with Visa 3DS...</span>
          </>
        ) : (
          <>
            <Shield className="w-4 h-4" />
            <span>Pay {amountFormatted} with Visa</span>
          </>
        )}
      </button>
    </form>
  );
}