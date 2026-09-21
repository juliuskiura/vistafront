"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createInvoiceFromOrder, serverMutate, type OrderItem } from "@/lib/api";
import { MAX_QTY, MIN_QTY } from "./_components/constants";

export interface QuantityActionResult {
  ok: boolean;
  message?: string;
}

/**
 * Server Action: persist a new absolute quantity for one order row.
 *
 * The checkout stepper calls this with the row's nanoid. The backend
 * `PATCH /apis/billing/order-items/<nanoid>/quantity/` sets the quantity
 * absolutely (min 1) and re-derives the row's amount, so the re-fetched
 * order total stays consistent. Called optimistically; the client reverts
 * to the previous quantity if the action fails.
 */
export async function updateOrderItemQuantity(input: {
  nanoid: string;
  quantity: number;
  workspace: string;
  orderNanoid: string;
}): Promise<QuantityActionResult> {
  const quantity = Math.min(
    MAX_QTY,
    Math.max(MIN_QTY, Math.round(input.quantity)),
  );
  try {
    await serverMutate<OrderItem>(
      `/apis/billing/order-items/${input.nanoid}/quantity/`,
      { method: "PATCH", body: { quantity }, workspace: input.workspace },
    );
    revalidatePath(`/${input.workspace}/dashboard/orders/${input.orderNanoid}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not update this line. Please try again.";
    return { ok: false, message };
  }
}

export interface ConfirmOrderResult {
  ok: boolean;
  message?: string;
}

/**
 * Server Action: remove one order row immediately.
 *
 * The checkout's X button calls this. `DELETE /apis/billing/order-items/
 * <nanoid>/` removes the row in the backend, and the order total re-derives
 * from the rows that remain; the page revalidates so the list re-renders
 * without the line. There is no restore — a removed line must be re-quoted
 * through order creation.
 */
export async function removeOrderItem(input: {
  nanoid: string;
  workspace: string;
  orderNanoid: string;
}): Promise<ConfirmOrderResult> {
  try {
    await serverMutate(`/apis/billing/order-items/${input.nanoid}/`, {
      method: "DELETE",
      body: {},
      workspace: input.workspace,
    });
    revalidatePath(`/${input.workspace}/dashboard/orders/${input.orderNanoid}`);
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not remove this line. Please try again.";
    return { ok: false, message };
  }
}

/**
 * Server Action: confirm a checkout and create its invoice.
 *
 * Called from the order page's "Confirm & Pay" button. The backend invoices
 * every line on the order as it stands (whole order — no line is knocked out
 * anymore) and the endpoint is idempotent, so re-confirming an order that
 * already carries an invoice returns that invoice instead of duplicating it.
 * On success the action hands off to the rendered invoice page (path-only URL,
 * no query params).
 */
export async function confirmOrder(input: {
  orderNanoid: string;
  workspace: string;
}): Promise<ConfirmOrderResult> {
  let invoice;
  try {
    invoice = await createInvoiceFromOrder(input.orderNanoid, [], {
      workspace: input.workspace,
    });
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not confirm this order. Please try again.";
    return { ok: false, message };
  }
  redirect(`/${input.workspace}/dashboard/invoices/${invoice.nanoid}`);
}