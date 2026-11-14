import type { Money, Product } from "./commerce/types";

export function formatPrice(price: Money | null): string {
  if (!price) return "Price to be announced";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: price.currencyCode }).format(Number(price.amount));
}

export const statusLabel: Record<Product["status"], string> = {
  "in-development": "In development",
  "coming-soon": "Coming soon",
  available: "Available",
  "sold-out": "Sold out",
};
