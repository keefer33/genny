// Token management utilities

export interface TokenPackage {
  id: string;
  amount: number;
  tokens: number;
  price: number;
  bonus: number;
  popular?: boolean;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  {
    id: "5",
    amount: 5,
    tokens: 1000,
    price: 500, // cents
    bonus: 0,
    popular: false,
  },
  {
    id: "10",
    amount: 10,
    tokens: 2050,
    price: 1000, // cents
    bonus: 50,
    popular: true,
  },
  {
    id: "25",
    amount: 25,
    tokens: 5200,
    price: 2500, // cents
    bonus: 200,
    popular: false,
  },
  {
    id: "50",
    amount: 50,
    tokens: 10700,
    price: 5000, // cents
    bonus: 700,
    popular: false,
  },
  {
    id: "100",
    amount: 100,
    tokens: 22000,
    price: 10000, // cents
    bonus: 2000,
    popular: false,
  },
];

export function formatTokens(tokens: number): string {
  if (tokens >= 1000) {
    return `${(tokens / 1000).toFixed(1)}k`;
  }
  return tokens.toString();
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`;
}

export function getTokenPackage(amount: number): TokenPackage | undefined {
  return TOKEN_PACKAGES.find((pkg) => pkg.amount === amount);
}

export function calculateTokenValue(tokens: number, priceInCents: number): number {
  return tokens / (priceInCents / 100);
}
