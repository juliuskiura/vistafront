import { serverFetch, serverMutate } from "./server-fetch";
import type { Order, OrderInput, Paginated } from "./types";

/**
 * Get a single order by nanoid (scoped to the active workspace's ClientBusiness).
 */
export async function getOrder(
  nanoid: string,
  { workspace }: { workspace: string },
): Promise<Order> {
  return serverFetch<Order>(`/apis/billing/orders/${nanoid}/`, { workspace });
}

/**
 * List the active org's orders, newest first.
 */
export async function listOrders({
  workspace,
}: {
  workspace: string;
}): Promise<Order[]> {
  const payload = await serverFetch<Paginated<Order> | Order[]>(
    "/apis/billing/orders/",
    { workspace },
  );
  return Array.isArray(payload) ? payload : payload.results ?? [];
}

/**
 * Create an order for the active org.
 *
 * Body is addressed by nanoids: ``client_business`` (the org) and ``plan``
 * (the SubsPlan being purchased). The backend resolves the plan into an order
 * item and attaches it to the org's active order (reusing it when one is open).
 */
export async function createOrder(
  body: OrderInput,
  { workspace }: { workspace: string },
): Promise<Order> {
  return serverMutate<Order>("/apis/billing/orders/", {
    method: "POST",
    body,
    workspace,
  });
}

/**
 * Cancel an order the customer no longer wants to check out.
 *
 * ``POST /apis/billing/orders/<nanoid>/cancel/`` runs the order lifecycle
 * (DRAFT/PENDING/CONFIRMED → CANCELLED, stamping ``cancelled_at``) and is
 * idempotent — an already-cancelled order is accepted, which makes repeated
 * clicks harmless.
 */
export async function cancelOrder(
  nanoid: string,
  { workspace }: { workspace: string },
): Promise<Order> {
  return serverMutate<Order>(`/apis/billing/orders/${nanoid}/cancel/`, {
    method: "POST",
    body: {},
    workspace,
  });
}