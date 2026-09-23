import type { FeatureKey, SubscriptionState } from "@/lib/api";

/**
 * The derived UI state for a feature key. Presentation layer only — the
 * rules live in Django; this file only maps the backend's facts to UI state.
 */
export type FeatureState = "available" | "locked" | "unavailable";

/**
 * Map the backend's subscription facts to a UI state.
 *
 * | owned | active | state        |
 * |-------|--------|--------------|
 * | yes   | yes    | available    |
 * | yes   | no     | locked       |
 * | no    | any    | unavailable  |
 * | exempt| any    | available    |
 *
 * ``locked`` covers expired, cancelled and past-due uniformly because they
 * all surface as ``active: false`` from Django. The frontend never branches
 * on the reason.
 */
export function deriveFeatureState(
  state: SubscriptionState,
  key: FeatureKey,
): FeatureState {
  if (state.exempt) {
    return "available";
  }
  if (!state.features.includes(key)) {
    return "unavailable";
  }
  return state.subscription?.active ? "available" : "locked";
}

/** Whether the feature may be used right now (route/UI protection). */
export function canUseFeature(
  state: SubscriptionState,
  key: FeatureKey,
): boolean {
  return deriveFeatureState(state, key) === "available";
}