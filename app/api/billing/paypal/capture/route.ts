import { NextResponse } from "next/server";

import { capturePaypalOrder } from "@/lib/api";

/**
 * Route Handler — PayPal's return URL after a buyer approves an order.
 *
 * PayPal bounces the browser here (with ``?token=<order id>`` + ``PayerID``)
 * after the buyer approves. We read the workspace/invoice from the query,
 * capture the order against Django, and redirect back to the tenant's invoice
 * page so the checkout hands off cleanly. Called by PayPal's redirect, not by
 * the client island.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const workspace = url.searchParams.get("workspace") ?? "";
  const invoice = url.searchParams.get("invoice") ?? "";
  const orderId = url.searchParams.get("token") ?? "";

  const invoicePath = workspace
    ? `/${workspace}/dashboard/invoices/${invoice}`
    : "/";

  if (!workspace || !invoice || !orderId) {
    return NextResponse.redirect(
      new URL(`${invoicePath}?paypal=error`, request.url),
    );
  }

  try {
    await capturePaypalOrder(orderId, { workspace });
  } catch {
    return NextResponse.redirect(
      new URL(`${invoicePath}?paypal=error`, request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`${invoicePath}?paypal=approved`, request.url),
  );
}