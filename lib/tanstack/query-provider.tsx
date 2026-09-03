"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Client-side TanStack Query provider. Mounts a single `QueryClient` per
 * browser session and makes it available to every descendant Client
 * Component that calls `useQuery` / `useMutation`.
 *
 * Use this in the root layout (or any layout that owns Client islands
 * which need query cache access). Wrap the tree with `<QueryProvider>`
 * — typically right inside `<body>` after `<SessionProvider>` /
 * `<ToastProvider>` and other Context providers.
 *
 * The default options below mirror the AGENTS.md "live but not aggressive"
 * stance: refetch on window focus and on reconnect, but no automatic
 * retry of mutations (let the caller decide).
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: true,
            staleTime: 30_000,
            retry: 1,
          },
          mutations: {
            retry: 0,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}