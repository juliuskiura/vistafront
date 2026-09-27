import { capturePaypalOrder } from "@/lib/api";
import { redirectTo } from "@/lib/redirect.server";

/**
 * Route Handler — PayPal's return URL after a buyer approves an order.
 *
 * PayPal bounces the browser here (with ``?token=<order id>`` + ``PayerID``)
 * after the buyer approves. We read the workspace/invoice from the query,
 * capture the order against Django, and redirect back to the tenant's invoice
 * page so the checkout hands off cleanly. Called by PayPal's redirect, not by
 * the client island.
 *
 * The three hops back to the invoice page use relative `Location` paths (see
 * `redirectTo`) so PayPal's callback can never bounce the buyer off
 * app.vistasolve.net onto a loopback address.
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
    return redirectTo(`${invoicePath}?paypal=error`);
  }

  try {
    await capturePaypalOrder(orderId, { workspace });
  } catch {
    return redirectTo(`${invoicePath}?paypal=error`);
  }

  return redirectTo(`${invoicePath}?paypal=approved`);
}