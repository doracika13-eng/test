"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Money } from "@/lib/commerce/types";

export type CartLine = {
  variantId: string;
  handle: string;
  title: string;
  colorway: string;
  size: string;
  image: string;
  price: Money | null;
  quantity: number;
};

type CheckoutState = { status: "idle" | "loading" | "error"; message?: string };

type CartCtx = {
  lines: CartLine[];
  count: number;
  subtotal: Money | null;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  update: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  checkout: () => Promise<void>;
  checkoutState: CheckoutState;
  lastAdded: string | null;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "dami.bag.v1";
const MAX_QTY = 10;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({ status: "idle" });
  const [lastAdded, setLastAdded] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      /* storage unavailable — bag stays in memory */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, hydrated]);

  const add = useCallback<CartCtx["add"]>((line, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.variantId === line.variantId);
      if (found) return prev.map((l) => (l.variantId === line.variantId ? { ...l, quantity: Math.min(MAX_QTY, l.quantity + qty) } : l));
      return [...prev, { ...line, quantity: Math.min(MAX_QTY, qty) }];
    });
    setLastAdded(line.variantId);
    setCheckoutState({ status: "idle" });
    setOpen(true);
  }, []);

  const update = useCallback((variantId: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => l.variantId !== variantId) : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_QTY, qty) } : l)),
    );
  }, []);

  const remove = useCallback((variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)), []);

  const checkout = useCallback(async () => {
    setCheckoutState({ status: "loading" });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })) }),
      });
      const data = (await res.json()) as { checkoutUrl?: string; message?: string };
      if (res.ok && data.checkoutUrl) {
        window.location.assign(data.checkoutUrl);
        return;
      }
      setCheckoutState({ status: "error", message: data.message || "Checkout is unavailable right now." });
    } catch {
      setCheckoutState({ status: "error", message: "Network error — please try again." });
    }
  }, [lines]);

  const value = useMemo<CartCtx>(() => {
    const count = lines.reduce((n, l) => n + l.quantity, 0);
    const priced = lines.length > 0 && lines.every((l) => l.price);
    const subtotal = priced
      ? {
          amount: lines.reduce((s, l) => s + Number(l.price!.amount) * l.quantity, 0).toFixed(2),
          currencyCode: lines[0].price!.currencyCode,
        }
      : null;
    return { lines, count, subtotal, open, setOpen, add, update, remove, checkout, checkoutState, lastAdded };
  }, [lines, open, add, update, remove, checkout, checkoutState, lastAdded]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used inside CartProvider");
  return c;
}
