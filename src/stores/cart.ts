"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSyncExternalStore } from "react";

// Prices here are for display only. The server re-prices everything at checkout.

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  imageUrl: string | null;
  isVeg: boolean;
  variantId: string | null;
  variantName: string | null;
  addonIds: string[];
  addonNames: string[];
  unitPrice: number;
  quantity: number;
};

type NewLine = Omit<CartLine, "key" | "quantity">;

type CartState = {
  lines: CartLine[];
  add: (line: NewLine, quantity?: number) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

export function lineKey(productId: string, variantId: string | null, addonIds: string[]): string {
  return [productId, variantId ?? "-", [...addonIds].sort().join("+")].join("|");
}

const MAX_QTY = 50;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (line, quantity = 1) =>
        set((state) => {
          const key = lineKey(line.productId, line.variantId, line.addonIds);
          const existing = state.lines.find((l) => l.key === key);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.key === key ? { ...l, ...line, quantity: Math.min(MAX_QTY, l.quantity + quantity) } : l,
              ),
            };
          }
          return { lines: [...state.lines, { ...line, key, quantity: Math.min(MAX_QTY, quantity) }] };
        }),
      setQuantity: (key, quantity) =>
        set((state) => ({
          lines:
            quantity <= 0
              ? state.lines.filter((l) => l.key !== key)
              : state.lines.map((l) => (l.key === key ? { ...l, quantity: Math.min(MAX_QTY, quantity) } : l)),
        })),
      remove: (key) => set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "fp-cart", version: 1 },
  ),
);

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.unitPrice * l.quantity, 0);
}

const noopSubscribe = () => () => {};

/** False during SSR and the first client render; avoids hydration mismatches for persisted state. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
