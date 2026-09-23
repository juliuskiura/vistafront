"use client";

import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { FeatureKey, SubscriptionState } from "@/lib/api";
import {
  canUseFeature,
  deriveFeatureState,
  type FeatureState,
} from "@/lib/features/derived";

interface SubscriptionContextValue {
  /** The raw backend contract the app bootstrapped from. */
  state: SubscriptionState;
  /** Derived UI state for a feature key. */
  featureState(key: FeatureKey): FeatureState;
  /** True when the feature is usable right now (route/UI protection). */
  canUseFeature(key: FeatureKey): boolean;
  /** True when the feature is owned but the subscription is inactive. */
  isLocked(key: FeatureKey): boolean;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(
  null,
);

/**
 * Provides the subscription contract to the client tree.
 *
 * The server layout fetches the state once (React `cache()`) and hands it to
 * this provider; consuming components call `useSubscription()` for the
 * derived helpers. This is presentation only — Django enforces every API
 * call on its own.
 */
export function SubscriptionProvider({
  state,
  children,
}: {
  state: SubscriptionState;
  children: ReactNode;
}) {
  const value = useMemo<SubscriptionContextValue>(
    () => ({
      state,
      featureState: (key) => deriveFeatureState(state, key),
      canUseFeature: (key) => canUseFeature(state, key),
      isLocked: (key) => deriveFeatureState(state, key) === "locked",
    }),
    [state],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return ctx;
}