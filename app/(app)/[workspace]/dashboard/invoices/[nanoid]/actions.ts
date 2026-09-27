"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createPaypalCheckout } from "@/lib/api";
import { APP_BASE_URL, isDeployedBuild } from "@/lib/env";

export interface PaypalCheckoutResult {
  ok: boolean;
  message?: string;
}

/**
 * Server Action: open a PayPal order for an invoice and hand the buyer over
 * to PayPal.
 *
 * The markup on the chargeable amount is applied on the Django side and never
 * leaves the backend — this action simply asks `paypal/create` for the buyer's
 * approve URL and `redirect`s to it (external, absolute URL). The absolute
 * return/cancel URLs are rebuilt from the incoming request so PayPal bounces
 * the buyer back to this tenant's invoice page. On backend failure it returns
 * an error message for the form to display.
 */
export async function startPaypalCheckout(input: {
  invoiceNanoid: string;
  workspace: string;
}): Promise<PaypalCheckoutResult> {
  const cookieStore = await cookies();
  if (!cookieStore.get("access")) {
    return { ok: false, message: "Please sign in before checking out." };
  }

  const origin = await resolveAppOrigin();

  const order = await createPaypalCheckout(input.invoiceNanoid, {
    workspace: input.workspace,
    returnUrl: `${origin}/api/billing/paypal/capture?workspace=${input.workspace}&invoice=${input.invoiceNanoid}`,
    cancelUrl: `${origin}/${input.workspace}/dashboard/invoices/${input.invoiceNanoid}?paypal=cancelled`,
  });

  if (!order.approve_url) {
    return { ok: false, message: "PayPal did not return a checkout link." };
  }

  redirect(order.approve_url);
}

/**
 * Absolute app origin for the current request, so PayPal's return/cancel URLs
 * point back at this tenant's invoice page.
 *
 * nginx forwards `Host` and `X-Forwarded-Proto`, so the forwarded headers are
 * the accurate source. The `APP_BASE_URL` fallback is only for the case where
 * no host header survives at all — and it is a real hostname
 * (https://app.vistasolve.net), never a loopback address: this value is
 * handed to PayPal as a return URL, and "localhost:3000" in a URL PayPal
 * redirects a paying customer to is a broken checkout.
 */
async function resolveAppOrigin(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto =
    headerList.get("x-forwarded-proto") ??
    (isDeployedBuild ? "https" : "http");
  return host ? `${proto}://${host}` : APP_BASE_URL;
}