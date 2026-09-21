"use client";

import { useEffect, useState } from "react";
import { MpesaFormData } from "./types";
import { MpesaLogo } from "./brand-logos";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ShieldCheck,
  Smartphone,
} from "@/lib/icons";

interface MpesaFormProps {
  formData: MpesaFormData;
  onChange: (data: MpesaFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isProcessing: boolean;
  amountKES: string;
  invoiceNumber: string;
}

type StkPhase = "idle" | "prompted" | "approved";

export function MpesaForm({
  formData,
  onChange,
  onSubmit,
  isProcessing,
  amountKES,
  invoiceNumber,
}: MpesaFormProps) {
  const [stkPhase, setStkPhase] = useState<StkPhase>("idle");
  const [countdown, setCountdown] = useState(45);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  useEffect(() => {
    if (stkPhase !== "prompted") return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [stkPhase]);

  useEffect(() => {
    if (stkPhase === "prompted" && countdown === 0) {
      const timer = setTimeout(() => setStkPhase("idle"), 0);
      return () => clearTimeout(timer);
    }
  }, [stkPhase, countdown]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSendStkPush = (e: React.FormEvent) => {
    e.preventDefault();
    setCountdown(45);
    setStkPhase("prompted");
  };

  const handleApprovePin = () => {
    setStkPhase("approved");
    setTimeout(() => {
      onSubmit({ preventDefault: () => {} } as React.FormEvent);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex p-1 rounded-xl glass-surface gap-1">
        <button
          type="button"
          onClick={() => onChange({ ...formData, preferredMode: "stk_push" })}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            formData.preferredMode === "stk_push"
              ? "glass-surface-green text-emerald-600 dark:text-emerald-300 shadow-sm border-emerald-500/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Express Mpesa Prompt</span>
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...formData, preferredMode: "paybill" })}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
            formData.preferredMode === "paybill"
              ? "glass-surface-green text-emerald-600 dark:text-emerald-300 shadow-sm border-emerald-500/40"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Copy className="w-3.5 h-3.5" />
          <span>Paybill Manual Entry</span>
        </button>
      </div>

      {formData.preferredMode === "stk_push" ? (
        <form id="mpesa-stk-form" onSubmit={handleSendStkPush} className="space-y-5">
          <div className="glass-surface-green p-4 md:p-5 rounded-2xl relative overflow-hidden">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
                  <MpesaLogo className="h-6 w-auto" />
                </div>
                <div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-300 uppercase tracking-wider block">
                    Lipa na M-PESA Online
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Direct automated SIM toolkit prompt
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                  Amount Due
                </span>
                <span className="font-display font-bold text-lg text-foreground tracking-tight">
                  {amountKES}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your Safaricom mobile number. You will receive an instant
              pop-up on your phone asking you to authorize this payment with
              your M-PESA PIN.
            </p>
          </div>

          <div>
            <label
              htmlFor="mpesa-phone-input"
              className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
            >
              M-PESA Registered Mobile Number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1.5 text-xs font-semibold text-foreground/80 pointer-events-none pr-2 border-r border-border/60">
                <span className="text-base" role="img" aria-label="Kenya flag">
                  🇰🇪
                </span>
                <span>+254</span>
              </div>
              <input
                id="mpesa-phone-input"
                type="tel"
                placeholder="712 345 678"
                value={formData.phoneNumber.replace(/^\+254/, "")}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/\D/g, "");
                  onChange({ ...formData, phoneNumber: `+254${cleaned}` });
                }}
                required
                className="glass-input w-full px-4 py-3 pl-22 rounded-xl font-mono text-sm tracking-wide"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <span>
                Supports Safaricom 07XX, 011X, and international East Africa
                roaming.
              </span>
            </p>
          </div>

          <div>
            <label
              htmlFor="mpesa-ref-input"
              className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
            >
              Account Reference
            </label>
            <input
              id="mpesa-ref-input"
              type="text"
              readOnly
              value={formData.accountReference}
              className="glass-input w-full px-4 py-3 rounded-xl font-mono text-xs opacity-80 cursor-not-allowed bg-card/40"
            />
          </div>

          {stkPhase !== "idle" && (
            <div className="space-y-3 checkout-fade-slide">
              {stkPhase === "prompted" && (
                <div className="p-4 rounded-2xl glass-surface-green border-2 border-emerald-500/60 shadow-xl relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                      <span className="font-semibold text-xs text-foreground uppercase tracking-wide">
                        Handset PIN Prompt Dispatched
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {countdown}s
                    </span>
                  </div>

                  <div className="bg-neutral-900 text-white p-3.5 rounded-xl text-xs font-mono space-y-2 border border-emerald-500/30 shadow-inner">
                    <div className="text-emerald-400 font-bold flex items-center justify-between">
                      <span>SIM TOOLKIT — M-PESA</span>
                      <span className="text-[10px] text-neutral-400">
                        SAFARICOM
                      </span>
                    </div>
                    <div className="text-[12px] leading-relaxed text-neutral-200">
                      Do you want to pay{" "}
                      <span className="text-white font-bold">{amountKES}</span>{" "}
                      to{" "}
                      <span className="text-emerald-300 font-bold">
                        VISTASOLVE
                      </span>{" "}
                      for Acc.{" "}
                      <span className="text-amber-300">
                        {formData.accountReference}
                      </span>
                      ?
                    </div>
                    <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-neutral-400">Enter M-PESA PIN:</span>
                      <span className="tracking-widest font-bold text-emerald-400">
                        ••••
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-muted-foreground">
                      Check your phone screen now.
                    </p>
                    <button
                      id="mpesa-simulate-pin-btn"
                      type="button"
                      onClick={handleApprovePin}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Authorize PIN Prompt</span>
                    </button>
                  </div>
                </div>
              )}

              {stkPhase === "approved" && (
                <div className="p-4 rounded-xl glass-surface-green text-center space-y-2">
                  <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 animate-bounce" />
                  </div>
                  <h4 className="font-semibold text-sm text-foreground">
                    PIN Received & Authenticated
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Safaricom Daraja confirmation token received. Finalizing
                    order...
                  </p>
                </div>
              )}
            </div>
          )}

          {stkPhase === "idle" && (
            <button
              id="mpesa-stk-btn"
              type="submit"
              disabled={isProcessing || formData.phoneNumber.length < 8}
              className="w-full py-3.5 px-6 rounded-xl font-display font-semibold text-sm tracking-wide text-white bg-linear-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting Safaricom Gateway...</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>Send STK Prompt ({amountKES})</span>
                </>
              )}
            </button>
          )}
        </form>
      ) : (
        <div className="space-y-4">
          <div className="glass-surface p-4 rounded-xl space-y-3">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <MpesaLogo className="h-4 w-auto" />
              <span>Manual Lipa na M-PESA Steps</span>
            </h4>
            <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
              <li>Open SIM Toolkit or M-PESA App on your handset</li>
              <li>
                Select{" "}
                <span className="font-semibold text-foreground">
                  Lipa na M-PESA
                </span>{" "}
                &gt;{" "}
                <span className="font-semibold text-foreground">
                  Pay Bill
                </span>
              </li>
              <li>Enter the Business No. and Account No. shown below</li>
              <li>
                Enter amount{" "}
                <span className="font-bold text-foreground">{amountKES}</span>{" "}
                and your PIN
              </li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="glass-surface p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                Business Number (Paybill)
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-foreground tracking-wider">
                  247247
                </span>
                <button
                  type="button"
                  onClick={() => copyToClipboard("247247", "paybill")}
                  className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedField === "paybill" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === "paybill" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            <div className="glass-surface p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-semibold text-muted-foreground block mb-1">
                Account Number
              </span>
              <div className="flex items-center justify-between">
                <span className="font-mono text-base font-bold text-emerald-500 tracking-wider">
                  {formData.accountReference}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    copyToClipboard(formData.accountReference, "account")
                  }
                  className="px-2 py-1 rounded-md bg-muted/60 hover:bg-muted text-xs font-medium text-foreground flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedField === "account" ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedField === "account" ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>

          <div>
            <label
              htmlFor="mpesa-code-input"
              className="block text-xs font-semibold text-foreground/90 mb-1.5 uppercase tracking-wider"
            >
              M-PESA Confirmation SMS Code
            </label>
            <div className="relative">
              <input
                id="mpesa-code-input"
                type="text"
                placeholder="e.g. SFB4892XZ1"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                className="glass-input w-full px-4 py-3 rounded-xl font-mono text-sm uppercase tracking-widest"
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Found in your Safaricom confirmation SMS (10 characters
              alphanumeric).
            </p>
          </div>

          <button
            id="mpesa-verify-code-btn"
            type="button"
            onClick={(e) => onSubmit(e as unknown as React.FormEvent)}
            disabled={isProcessing || manualCode.length < 8}
            className="w-full py-3.5 px-6 rounded-xl font-display font-semibold text-sm tracking-wide text-white bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] transition-all duration-200 shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            <span>Verify M-PESA Transaction</span>
          </button>

          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>
              Confirmation takes up to 2 minutes. Only complete this step after
              the debit shows on your phone.
            </span>
          </p>
        </div>
      )}
    </div>
  );
}