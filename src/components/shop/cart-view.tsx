"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/money";
import { cartSubtotal, useCart, useHydrated } from "@/stores/cart";
import { buttonVariants } from "@/components/ui/button";
import { VegMark } from "@/components/ui/badge";
import { FoodImage } from "./food-image";
import { QuantityStepper } from "./quantity-stepper";

export function CartView() {
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const setQuantity = useCart((s) => s.setQuantity);

  if (!hydrated) return <div className="h-40 animate-pulse rounded-2xl bg-stone-200" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <ShoppingBag className="mx-auto mb-3 size-10 text-stone-300" aria-hidden />
        <p className="font-semibold text-stone-800">Your cart is empty</p>
        <p className="mt-1 text-sm text-stone-500">Add something tasty from the menu.</p>
        <Link href="/menu" className={buttonVariants({ className: "mt-5" })}>
          Browse menu
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(lines);

  return (
    <div className="space-y-4">
      <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
        {lines.map((line) => (
          <li key={line.key} className="flex gap-3 p-4">
            <FoodImage src={line.imageUrl} alt={line.name} sizes="80px" className="size-16 shrink-0 rounded-xl sm:size-20" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <VegMark isVeg={line.isVeg} className="mt-0.5" />
                <p className="font-semibold text-stone-900">{line.name}</p>
              </div>
              {(line.variantName || line.addonNames.length > 0) && (
                <p className="mt-0.5 text-xs text-stone-500">
                  {[line.variantName, ...line.addonNames].filter(Boolean).join(" · ")}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between gap-2">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(q) => setQuantity(line.key, q)}
                  label={line.name}
                />
                <span className="font-semibold">{formatINR(line.unitPrice * line.quantity)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <div className="flex items-center justify-between text-base font-semibold">
          <span>Subtotal</span>
          <span>{formatINR(subtotal)}</span>
        </div>
        <p className="mt-1 text-xs text-stone-500">
          Delivery fee, taxes and coupons are applied at checkout.
        </p>
        <Link href="/checkout" className={buttonVariants({ size: "lg", className: "mt-4 w-full" })}>
          Proceed to checkout
        </Link>
        <Link href="/menu" className="mt-3 block text-center text-sm font-medium text-brand-700 hover:underline">
          Add more items
        </Link>
      </div>
    </div>
  );
}
