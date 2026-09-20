"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createOrder } from "@/lib/api";

// ── Zod schema (the validation contract for the choose-plan click) ──────────
// Kept module-private: a `"use server"` file may only *export* async functions.

const ChoosePlanSchema = z.object({
  clientBusiness: z.string().min(1, "Missing organization."),
  planNanoid: z.string().min(1, "Missing plan."),
  workspaceDomain: z.string().min(1, "Missing workspace."),
});
export type ChoosePlanInput = z.infer<typeof ChoosePlanSchema>;

/**
 * Place an order for the paid plan the workspace member clicked, then land
 * them on the order's invoice screen.
 *
 * Sends the org and plan nanoids to `POST /apis/billing/orders/`; the backend
 * resolves the plan into an order item on the org's active order and returns
 * the (possibly reused) order. On success the user is redirected to
 * `/{workspace}/dashboard/orders/{order.nanoid}`.
 */
export async function choosePaidPlan(input: ChoosePlanInput): Promise<void> {
  const parsed = ChoosePlanSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid plan selection.");
  }

  const { clientBusiness, planNanoid, workspaceDomain } = parsed.data;
  const order = await createOrder(
    {
      client_business: clientBusiness,
      plan: planNanoid,
      status: "pending",
      currency: "KES",
    },
    { workspace: workspaceDomain },
  );

  redirect(`/${workspaceDomain}/dashboard/orders/${order.nanoid}`);
}