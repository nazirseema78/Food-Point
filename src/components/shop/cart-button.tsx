"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/money";
import { cartCount, cartSubtotal, useCart, useHydrated } from "@/stores/cart";

export function CartButton() {
  const hydrated = useHydrated();
  const count = useCart((s) => cartCount(s.lines));
  const shown = hydrated ? count : 0;
  return (
    <Link
      href="/cart"
      className="relative inline-flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
      aria-label={`Cart, ${shown} item${shown === 1 ? "" : "s"}`}
    >
      <ShoppingBag className="size-5" />
      {shown > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-stone-900 px-1 text-[11px] font-bold leading-5 text-white">
          {shown > 99 ? "99+" : shown}
        </span>
      )}
    </Link>
  );
}

/** Sticky bottom bar on mobile when the cart has items. */
export function MobileCartBar() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  if (!hydrated || lines.length === 0) return null;
  const count = cartCount(lines);
  const subtotal = cartSubtotal(lines);
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 p-3 sm:hidden">
      <Link
        href="/cart"
        className="flex items-center justify-between rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white shadow-lg"
      >
        <span>
          {count} item{count === 1 ? "" : "s"} ·{" "}
          {formatINR(subtotal)}
        </span>
        <span className="inline-flex items-center gap-1">
          View cart <ShoppingBag className="size-4" />
        </span>
      </Link>
    </div>
  );
}
