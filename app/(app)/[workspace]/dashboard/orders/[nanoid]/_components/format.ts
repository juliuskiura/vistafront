export type DisplayCurrency = "KES" | "USD" | "EUR";

export const KES_PER_USD = 130;
export const EUR_PER_USD = 0.92;

/** Format a KES-denominated number into the requested display currency. */
export function formatPrice(kes: number, currency: DisplayCurrency): string {
  if (currency === "KES") {
    return `KES ${kes.toLocaleString()}`;
  }
  if (currency === "EUR") {
    return `€${((kes / KES_PER_USD) * EUR_PER_USD).toFixed(2)}`;
  }
  return `$${(kes / KES_PER_USD).toFixed(2)}`;
}