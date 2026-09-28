"use client";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { SessionExpiredError } from "@/lib/api/session-expired";

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
            /**
             * One retry for ordinary failures (the previous behaviour), but
             * more for a dead access token.
             *
             * `apiFetch` throws `SessionExpiredError` *after* calling
             * `router.refresh()`. That is a full round trip — proxy hop →
             * `/api/auth/check` → Django `/jwt/refresh/` → RSC re-render — and
             * it can easily outlast a single 1s retry, especially on a heavy
             * dashboard. Retrying at ~1s, ~3s and ~7s gives the fresh cookies
             * time to land without hiding real failures behind more attempts.
             */
            retry: (failureCount, error) =>
              error instanceof SessionExpiredError ? failureCount < 3 : failureCount < 1,
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