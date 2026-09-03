import "server-only";

import {
  HydrationBoundary,
  QueryClient,
  dehydrate,
  type QueryKey,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * Server-side wrapper that prefetches a query on the server and
 * dehydrates the cache, so a Client Component can pick up the data via
 * `useQuery` with the same `queryKey`. First paint ships with real
 * data; subsequent updates come from the client cache.
 *
 * Usage (Server Component):
 *
 * ```tsx
 * // app/(app)/[workspace]/dashboard/<feature>/page.tsx
 * import { LiveServerData } from "@/components/data/live-server-data";
 * import { listCompanies } from "@/lib/api";
 * import { CompaniesBoard } from "./companies-board";
 *
 * export default async function Page({ params }) {
 *   const { workspace: slug } = await params;
 *   const active = await requireWorkspace(slug);
 *   return (
 *     <LiveServerData
 *       queryKey={["companies", active.domain]}
 *       queryFn={() => listCompanies({ workspace: active.domain })}
 *     >
 *       <CompaniesBoard workspace={active.domain} />
 *     </LiveServerData>
 *   );
 * }
 * ```
 *
 * ```tsx
 * // app/(app)/[workspace]/dashboard/<feature>/<feature>-board.tsx
 * "use client";
 * import { useQuery } from "@tanstack/react-query";
 * import { listCompanies } from "@/lib/api";
 *
 * export function CompaniesBoard({ workspace }: { workspace: string }) {
 *   const { data } = useQuery({
 *     queryKey: ["companies", workspace],
 *     queryFn: () => listCompanies({ workspace }),
 *     refetchInterval: 60_000,
 *   });
 *   // …render `data` …
 * }
 * ```
 *
 * Both files use the SAME `queryKey`. The Server Component prefills the
 * cache; the Client Component reuses it. The `X-Workspace` header is
 * forwarded by `listCompanies` (or whatever domain-specific wrapper you
 * call), so this works for every tenant-scoped endpoint.
 *
 * When NOT to use this: a route that renders once and doesn't need live
 * updates. Plain Server Component + `serverFetch` + JSX is cheaper.
 */
export async function LiveServerData<TData>({
  queryKey,
  queryFn,
  children,
}: {
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
  children: ReactNode;
}) {
  const client = new QueryClient();
  await client.prefetchQuery({ queryKey, queryFn });
  return (
    <HydrationBoundary state={dehydrate(client)}>{children}</HydrationBoundary>
  );
}