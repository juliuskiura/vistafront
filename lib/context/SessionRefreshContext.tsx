"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  apiFetch,
  type ApiFetch,
  type SessionRecovery,
} from "@/lib/api/client-fetch";

/**
 * Session recovery for Client Components.
 *
 * `apiFetch` is a plain function, so it cannot call `useRouter()` — hooks only
 * work inside a component. This provider is the one place that owns the router,
 * and it hands the resulting callback down through context. That keeps the
 * dependency explicit (no module-level navigator, no `window.location`) while
 * letting any client island recover from an expired token in one call:
 *
 * ```tsx
 * const apiFetch = useApiFetch();
 * const data = await apiFetch("/api/schedules/today?workspace=regwakes").then((r) => r.json());
 * ```
 *
 * Mounted once in `app/layout.tsx`. The default context value is a no-op, so a
 * component that renders outside the provider still works — it just throws
 * `SessionExpiredError` instead of recovering.
 */

type SessionRefresh = SessionRecovery;

const REFRESH_COOLDOWN_MS = 10_000;

const SessionRefreshContext = createContext<SessionRefresh>(() => {});

export function SessionRefreshProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const lastRefreshAt = useRef<number | null>(null);

  /**
   * Several queries can receive the same expired-session response at once.
   * Only one page refresh is needed to run the proxy refresh hop; parallel
   * refreshes can race Django's one-time refresh-token rotation.
   */
  const refresh = useCallback(() => {
    const now = Date.now();
    if (
      lastRefreshAt.current !== null &&
      now - lastRefreshAt.current < REFRESH_COOLDOWN_MS
    ) {
      return;
    }

    lastRefreshAt.current = now;
    router.refresh();
  }, [router]);

  const value = useMemo(() => refresh, [refresh]);

  return (
    <SessionRefreshContext.Provider value={value}>
      {children}
    </SessionRefreshContext.Provider>
  );
}

/** Just the recovery callback, for code that manages its own `fetch`. */
export function useSessionRefresh(): SessionRefresh {
  return useContext(SessionRefreshContext);
}

/**
 * `fetch` bound to this subtree's session recovery. Same signature as `fetch`
 * plus nothing — `init` is the second argument, `recover` is pre-bound.
 */
export function useApiFetch(): ApiFetch {
  const recover = useSessionRefresh();

  return useCallback(
    (input: RequestInfo | URL, init?: RequestInit) =>
      apiFetch(input, init, recover),
    [recover],
  );
}
