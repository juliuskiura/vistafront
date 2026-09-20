"use client";

import { useMemo, useState } from "react";
import { ChevronRight, HelpCircle, ShieldCheck } from "@/lib/icons";

import {
  type ClientBusiness,
  type Order,
  type PaymentMethod,
  type SubsPlan,
} from "@/lib/api";
import { buildInvoiceData } from "../invoice-data";
import { formatMediumDate } from "@/lib/dates";
import { PaymentMethodSelector } from "./_components/payment-method-selector";
import {
  type CardFormData,
  type CheckoutCurrency,
  type MpesaFormData,
  type PaymentMethodId,
  type PaypalFormData,
  type TransactionReceipt,
} from "./_components/types";
import { formatPrice, KES_PER_USD, OrderSummary } from "./_components/order-summary";
import { MpesaForm } from "./_components/mpesa-form";
import { VisaForm } from "./_components/visa-form";
import { PaypalForm } from "./_components/paypal-form";
import { PaymentSuccessModal } from "./_components/payment-success-modal";

function toPlus254(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return `+${digits}`;
  if (digits.startsWith("0")) return `+254${digits.slice(1)}`;
  return digits ? `+254${digits}` : "";
}

interface PaymentCheckoutClientProps {
  order: Order;
  plan: SubsPlan;
  paymentMethods: PaymentMethod[];
  workspaceName: string;
  organization: ClientBusiness;
  /** Subset of order item nanoids to bill; undefined = the full order. */
  keptItemNanoids?: string[];
}

export function PaymentCheckoutClient({
  order,
  plan,
  paymentMethods,
  workspaceName,
  organization,
  keptItemNanoids,
}: PaymentCheckoutClientProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodId>("mpesa");
  const [currency, setCurrency] = useState<CheckoutCurrency>("KES");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);

  const [discountPercent, setDiscountPercent] = useState(0);
  const [activePromo, setActivePromo] = useState("");

  const invoiceData = useMemo(
    () => buildInvoiceData(order, plan, keptItemNanoids),
    [order, plan, keptItemNanoids],
  );
  const baseKES = invoiceData.totalAmount;
  const invoiceNumber = invoiceData.invoiceNumber;
  const defaultPhone = useMemo(() => {
    const fallback =
      paymentMethods.find((m) => m.is_default) ??
      paymentMethods.find((m) => m.phone) ??
      null;
    return fallback?.phone ? toPlus254(fallback.phone) : "";
  }, [paymentMethods]);
  const accountReference = invoiceNumber;

  const [cardData, setCardData] = useState<CardFormData>({
    cardNumber: "",
    cardHolder: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    saveCard: false,
  });

  const [mpesaData, setMpesaData] = useState<MpesaFormData>({
    phoneNumber: defaultPhone,
    accountReference,
    preferredMode: "stk_push",
  });

  const [paypalData, setPaypalData] = useState<PaypalFormData>({
    email: "",
    usePayIn4: false,
    rememberAccount: false,
  });

  const orderLines = useMemo(
    () =>
      invoiceData.items
        .filter((item) => item.total > 0)
        .map((item) => ({
          description: item.description,
          detail:
            (item.quantity ?? 1) > 1
              ? `${item.quantity} × ${formatPrice(item.unitPrice || 0, "KES")}`
              : undefined,
          quantity: item.quantity,
          total: item.total,
        })),
    [invoiceData],
  );
  const includedCount = useMemo(
    () => invoiceData.items.filter((item) => item.total === 0).length,
    [invoiceData],
  );

  const discountedKES = baseKES * (1 - discountPercent / 100);
  const amountKES = `KES ${Math.round(discountedKES).toLocaleString()}`;
  const amountUSD = discountedKES / KES_PER_USD;

  const handleSelectMethod = (method: PaymentMethodId) => {
    setSelectedMethod(method);
    if (method === "mpesa" && currency === "USD") {
      setCurrency("KES");
    } else if (method !== "mpesa" && currency === "KES") {
      setCurrency("USD");
    }
  };

  const handleApplyPromo = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (clean === "VIP20" || clean === "SAVE20") {
      setDiscountPercent(20);
      setActivePromo(clean);
      return true;
    }
    if (clean === "GLASS" || clean === "VISTASOLVE") {
      setDiscountPercent(15);
      setActivePromo(clean);
      return true;
    }
    return false;
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      let payerInfo = "";

      if (selectedMethod === "visa") {
        const last4 = cardData.cardNumber.replace(/\s/g, "").slice(-4);
        payerInfo = last4 ? `Visa ending in ${last4}` : "Visa Card";
      } else if (selectedMethod === "mpesa") {
        payerInfo = `M-PESA (${mpesaData.phoneNumber || "N/A"})`;
      } else {
        payerInfo = paypalData.email || "PayPal Account";
      }

      setReceipt({
        transactionId: `TX-${selectedMethod.toUpperCase()}-${randomSuffix}-VS`,
        method: selectedMethod,
        amount: currency === "KES" ? Math.round(discountedKES) : amountUSD,
        currency,
        date: formatMediumDate(new Date().toISOString()),
        status: "completed",
        payerInfo,
        referenceNumber: `REF-${Math.random()
          .toString(36)
          .substring(2, 9)
          .toUpperCase()}`,
      });
    }, 1600);
  };

  return (
    <>
      <nav
        aria-label="Progress"
        className="mx-auto w-full max-w-5xl pt-5 pb-2"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="text-muted-foreground/70">1. Solution Review</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-muted-foreground/70">2. Billing Info</span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="font-semibold text-primary flex items-center gap-1">
            <span className="w-4 h-4 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
              3
            </span>
            Payment Method
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
          <span className="text-muted-foreground/50">4. Confirmation</span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-5xl flex-1 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <section className="lg:col-span-7 space-y-6">
            <div className="space-y-1.5">
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-foreground tracking-tight">
                Select Payment Channel
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Choose between global card networks, East Africa&apos;s instant
                M-PESA mobile money, or PayPal checkout to settle the{" "}
                {plan.label} invoice for {workspaceName}.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-5 sm:p-7 space-y-6">
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onSelect={handleSelectMethod}
              />

              <div
                key={selectedMethod}
                className="pt-2 checkout-fade-slide"
              >
                {selectedMethod === "visa" && (
                  <VisaForm
                    formData={cardData}
                    onChange={setCardData}
                    onSubmit={handlePaymentSubmit}
                    isProcessing={isProcessing}
                    amountFormatted={formatPrice(discountedKES, currency)}
                  />
                )}

                {selectedMethod === "mpesa" && (
                  <MpesaForm
                    formData={mpesaData}
                    onChange={setMpesaData}
                    onSubmit={handlePaymentSubmit}
                    isProcessing={isProcessing}
                    amountKES={amountKES}
                  />
                )}

                {selectedMethod === "paypal" && (
                  <PaypalForm
                    formData={paypalData}
                    onChange={setPaypalData}
                    onSubmit={handlePaymentSubmit}
                    isProcessing={isProcessing}
                    amountUSD={amountUSD}
                  />
                )}
              </div>
            </div>
          </section>

          <aside className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">
            <OrderSummary
              invoiceNumber={invoiceNumber}
              lines={orderLines}
              includedCount={includedCount}
              baseKES={baseKES}
              currency={currency}
              onCurrencyChange={setCurrency}
              discountPercent={discountPercent}
              onApplyPromo={handleApplyPromo}
              promoCode={activePromo}
            />

            <div className="glass-surface p-4 rounded-xl flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-primary dark:text-primary-400" />
                <span>Need payment assistance?</span>
              </div>
              <span className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors">
                24/7 Concierge
              </span>
            </div>

            <div className="glass-surface p-4 rounded-xl flex items-center gap-3 text-[11px] text-muted-foreground">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Payment settled to{" "}
                <span className="font-semibold text-foreground">
                  {organization.legal_name}
                </span>
                . Your bank-grade receipt is issued instantly.
              </span>
            </div>
          </aside>
        </div>
      </main>

      <PaymentSuccessModal receipt={receipt} onClose={() => setReceipt(null)} />

      <footer className="border-t border-border/40 mt-16 py-6 text-center text-xs text-muted-foreground/80">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Vistasolve Financial Services. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="hover:text-foreground cursor-pointer">
              Security Policy
            </span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">
              Terms of Service
            </span>
            <span>•</span>
            <span className="hover:text-foreground cursor-pointer">
              PCI Compliance
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}