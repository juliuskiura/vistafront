"use server";

import { revalidatePath } from "next/cache";

import { serverMutate, type OrderItem } from "@/lib/api";
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