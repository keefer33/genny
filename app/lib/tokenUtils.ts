// Display helpers + balance top-up presets (must match backend `TOP_UP_AMOUNTS_DOLLARS`).

export interface CreditTopUpOption {
  id: string;
  /** Whole USD dollars added to usage balance (1:1 with amount charged). */
  dollars: number;
  /** Stripe amount in cents */
  price: number;
  popular?: boolean;
}

export const CREDIT_TOP_UP_OPTIONS: CreditTopUpOption[] = [
  { id: "5", dollars: 5, price: 500, popular: false },
  { id: "10", dollars: 10, price: 1000, popular: true },
  { id: "25", dollars: 25, price: 2500, popular: false },
  { id: "50", dollars: 50, price: 5000, popular: false },
  { id: "100", dollars: 100, price: 10000, popular: false },
];

/** Parse DB numeric / string dollar fields (e.g. promotions.dollar_amount). */
export function parseDollarAmount(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function formatCredits(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}
