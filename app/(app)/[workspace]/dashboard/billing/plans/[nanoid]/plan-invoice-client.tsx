"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Phone, Smartphone } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VSButton } from "@/components/shared/components/customUi/VSButton";
import type { Plan } from "@/lib/api";

const MPESA_KE = /^(?:\+?254|0)[17]\d{8}$/;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s()-]/g, "");
  if (digits.startsWith("0")) return "254" + digits.slice(1);
  if (digits.startsWith("+")) return digits.slice(1);
  return digits;
}

function PaymentMethodOption() {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-4">
      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500">
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
      <span className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Smartphone className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-sm font-bold text-slate-900">M-Pesa</span>
          <span className="block text-xs text-slate-600">
            Pay instantly from your M-Pesa phone. Only payment mode available.
          </span>
        </span>
      </span>
    </label>
  );
}

function InvoiceSummary({ plan }: { plan: Plan }) {
  const price =
    plan.price_per_seat != null
      ? `Ksh ${Number(plan.price_per_seat).toLocaleString()}`
      : "Custom";
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
        Invoice summary
      </h2>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-bold text-slate-900">{plan.label}</p>
          <p className="text-sm text-slate-600">{plan.description}</p>
        </div>
        <span className="shrink-0 rounded-xl bg-primary-50 px-3 py-1.5 text-sm font-extrabold text-primary-700 border border-primary-100">
          {price}
          {plan.price_per_seat != null && (
            <span className="text-xs font-medium"> /month</span>
          )}
        </span>
      </div>

      <ul className="mt-5 space-y-2.5 text-sm text-slate-700">
        {(plan.features ?? []).map((feature) => (
          <li key={feature.nanoid} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
            <span>{feature.feature}</span>
          </li>
        ))}
        {(plan.feature_flags ?? []).map((flag, index) => (
          <li
            key={flag || index}
            className="flex items-start gap-3"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            </span>
            <span>{flag}</span>
          </li>
        ))}
        {plan.features.length === 0 && plan.feature_flags.length === 0 && (
          <li className="text-slate-500">No listed features.</li>
        )}
      </ul>

      <div className="mt-5 flex justify-between border-t border-slate-100 pt-4 text-sm">
        <span className="font-medium text-slate-600">Total due</span>
        <span className="font-extrabold text-slate-900">
          {price}
          {plan.price_per_seat != null && <span className="text-xs"> /month</span>}
        </span>
      </div>
    </section>
  );
}

export function PlanInvoiceClient({
  plan,
  workspaceDomain,
  workspaceName,
}: {
  plan: Plan;
  workspaceDomain: string;
  workspaceName: string;
}) {
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const phoneError =
    touched && phone.trim() !== "" && !MPESA_KE.test(phone.trim())
      ? "Enter a valid M-Pesa number, e.g. 0712 345 678 or 254712345678."
      : "";
  const missing = touched && phone.trim() === "";

  function handleConfirm() {
    setTouched(true);
    if (phone.trim() === "" || phoneError) return;
    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 pt-6">
        <BackLink workspaceDomain={workspaceDomain} />
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-7 w-7 stroke-[2.5]" />
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Payment request sent
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            An M-Pesa checkout request has been sent to{" "}
            <span className="font-bold text-slate-900">
              +{normalizePhone(phone)}
            </span>
            . Enter your M-Pesa PIN on your phone to complete the{" "}
            <span className="font-bold text-slate-900">{plan.label}</span>{" "}
            invoice.
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <VSButton
              asChild
              variant="primary"
              appearance="outline"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href={`/${workspaceDomain}/dashboard/billing`}>
                Back to Billing
              </Link>
            </VSButton>
            <VSButton
              asChild
              variant="primary"
              appearance="solid"
              size="lg"
              className="w-full sm:w-auto"
            >
              <Link href={`/${workspaceDomain}/dashboard`}>Go to Dashboard</Link>
            </VSButton>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 pt-6">
      <BackLink workspaceDomain={workspaceDomain} />

      <header>
        <h1 className="text-2xl font-semibold text-slate-900">
          Invoice Confirmation
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Review the charges for {workspaceName}, then choose how you&apos;ll
          pay.
        </p>
      </header>

      <InvoiceSummary plan={plan} />

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-slate-500">
          Payment method
        </h2>

        <div className="mt-4">
          <PaymentMethodOption />
        </div>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="mpesa-phone" className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-slate-500" />
            M-Pesa phone number
          </Label>
          <Input
            id="mpesa-phone"
            name="mpesa_phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="e.g. 0712 345 678"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            onBlur={() => setTouched(true)}
            aria-invalid={touched && (missing || Boolean(phoneError))}
          />
          {missing && (
            <p className="text-xs text-red-600">
              Enter the M-Pesa number to receive the payment prompt.
            </p>
          )}
          {phoneError && <p className="text-xs text-red-600">{phoneError}</p>}
        </div>

        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500 border border-slate-100">
          An M-Pesa (STK push) prompt will be sent to the number above. Keep
          your phone close to approve the payment when prompted.
        </p>
      </section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href={`/${workspaceDomain}/dashboard/billing`}
          className="text-sm font-medium text-slate-500 hover:text-slate-700"
        >
          Cancel
        </Link>
        <VSButton
          id="btn-confirm-payment"
          variant="primary"
          appearance="solid"
          size="lg"
          className="w-full sm:w-auto"
          onClick={handleConfirm}
        >
          Confirm &amp; Pay via M-Pesa →
        </VSButton>
      </div>
    </div>
  );
}

function BackLink({ workspaceDomain }: { workspaceDomain: string }) {
  return (
    <Link
      href={`/${workspaceDomain}/dashboard/billing`}
      className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700"
    >
      <ChevronLeft className="h-4 w-4" />
      Back to Billing
    </Link>
  );
}