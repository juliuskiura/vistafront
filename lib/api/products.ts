import { serverFetch } from "./server-fetch";
import type { Paginated, Product } from "./types";

/**
 * Products are global (not tenant-scoped in the queryset), but the endpoint
 * is gated behind the console-admin permission, which Django resolves from
 * the active workspace. Forward `X-Workspace` so the permission check sees
 * the console workspace.
 */
export async function listProducts(workspace: string): Promise<Product[]> {
  const all: Product[] = [];
  let page = 1;
  // Hard cap so a malformed `next` link can never spin forever.
  const MAX_PAGES = 1000;
  while (page <= MAX_PAGES) {
    const payload = await serverFetch<Product[] | Paginated<Product>>(
      `/apis/products/all/?page=${page}&page_size=100`,
      { workspace },
    );
    if (Array.isArray(payload)) {
      all.push(...payload);
      break;
    }
    all.push(...(payload?.results ?? []));
    if (!payload?.next) break;
    page += 1;
  }
  return all;
}
