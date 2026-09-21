"use client";

import { useState } from "react";
import { TransactionReceipt } from "./types";
import { MpesaLogo, PaypalLogo, VisaLogo } from "./brand-logos";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  X,
} from "@/lib/icons";

interface PaymentSuccessModalProps {
  receipt: TransactionReceipt | null;
  onClose: () => void;
}

export function PaymentSuccessModal({
  receipt,
  onClose,
}: PaymentSuccessModalProps) {
  const [copied, setCopied] = useState(false);

  if (!receipt) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(receipt.transactionId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const textContent = `
VISTASOLVE PAYMENT RECEIPT
=================================
Status: COMPLETED
Transaction ID: ${receipt.transactionId}
Reference: ${receipt.referenceNumber}
Payment Method: ${receipt.method.toUpperCase()}
Amount: ${receipt.currency} ${receipt.amount.toLocaleString()}
Payer: ${receipt.payerInfo}
Date: ${receipt.date}
=================================
Thank you for your business!
    `.trim();

    const blob = new Blob([textContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${receipt.transactionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const methodLabel =
    receipt.method === "visa"
      ? "Visa Platinum"
      : receipt.method === "mpesa"
        ? "Safaricom M-PESA"
        : "PayPal";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card rounded-3xl p-6 md:p-8 overflow-hidden shadow-2xl checkout-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full bg-card/60 hover:bg-card flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer border border-border/50"
          aria-label="Close receipt"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-3 mb-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8 stroke-[2.2]" />
            </div>
          </div>

          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-500 block mb-1">
              Payment Confirmed
            </span>
            <h2 className="font-display font-extrabold text-2xl md:text-3xl text-foreground tracking-tight">
              {receipt.currency} {receipt.amount.toLocaleString()}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Paid via {methodLabel}
            </p>
          </div>
        </div>

        <div className="glass-surface p-4 rounded-2xl space-y-2.5 text-xs mb-6 border border-border/60">
          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Transaction ID</span>
            <div className="flex items-center gap-1.5 font-mono text-foreground font-semibold">
              <span>{receipt.transactionId}</span>
              <button
                type="button"
                onClick={handleCopyId}
                className="p-1 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                title="Copy ID"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Payment Method</span>
            <div className="flex items-center gap-1.5">
              {receipt.method === "visa" && <VisaLogo className="h-3.5 w-auto" />}
              {receipt.method === "mpesa" && <MpesaLogo className="h-4 w-auto" />}
              {receipt.method === "paypal" && (
                <PaypalLogo className="h-3.5 w-auto" />
              )}
              <span className="font-medium text-foreground">
                {receipt.payerInfo}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Reference Number</span>
            <span className="font-mono text-foreground">
              {receipt.referenceNumber}
            </span>
          </div>

          <div className="flex items-center justify-between py-1 border-b border-border/40">
            <span className="text-muted-foreground">Date & Time</span>
            <span className="text-foreground">{receipt.date}</span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-muted-foreground">Status</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold text-[11px] border border-emerald-500/30">
              Settled & Verified
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            id="download-receipt-btn"
            type="button"
            onClick={handleDownload}
            className="flex-1 py-3 px-4 rounded-xl glass-surface hover:border-primary/50 text-foreground font-semibold text-xs tracking-wide transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-primary-400" />
            <span>Download Receipt</span>
          </button>

          <button
            id="done-receipt-btn"
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-600 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-primary/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Return to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}