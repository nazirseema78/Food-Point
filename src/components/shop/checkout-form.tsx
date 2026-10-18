"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Bike, Loader2, ShoppingBag, Tag, X } from "lucide-react";
import { toast } from "sonner";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart, useHydrated } from "@/stores/cart";
import { placeOrder, quoteOrder, type Quote } from "@/server/actions/checkout";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";

type OrderType = "DELIVERY" | "TAKEAWAY";

type Defaults = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  addressLine: string;
  area: string;
  city: string;
  pincode: string;
  landmark: string;
};

export function CheckoutForm({
  shop,
  defaults,
  isLoggedIn,
}: {
  shop: {
    isOpen: boolean;
    closedReason: string | null;
    deliveryEnabled: boolean;
    takeawayEnabled: boolean;
    addressLine: string;
    city: string;
  };
  defaults: Defaults;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const hydrated = useHydrated();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);

  const [type, setType] = useState<OrderType>(shop.deliveryEnabled ? "DELIVERY" : "TAKEAWAY");
  const [form, setForm] = useState({ ...defaults, notes: "" });
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, startQuote] = useTransition();
  const [placing, startPlace] = useTransition();
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});

  const items = useMemo(
    () =>
      lines.map((l) => ({
        productId: l.productId,
        variantId: l.variantId,
        addonIds: l.addonIds,
        quantity: l.quantity,
      })),
    [lines],
  );
  const itemsKey = JSON.stringify(items);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    startQuote(async () => {
      const res = await quoteOrder({ items, type, couponCode: coupon });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      setQuote(res.data);
      if (coupon && res.data.couponError) {
        toast.error(res.data.couponError);
        setCoupon(null);
      }
    });
    // itemsKey captures cart changes without depending on array identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, itemsKey, type, coupon]);

  if (!hydrated) return <div className="h-64 animate-pulse rounded-2xl bg-stone-200" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
        <p className="font-semibold">Your cart is empty</p>
        <Link href="/menu" className={buttonVariants({ className: "mt-4" })}>
          Browse menu
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function applyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCoupon(code);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    startPlace(async () => {
      const res = await placeOrder({ ...form, type, items, couponCode: coupon });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      clear();
      router.push(`/orders/${res.data.orderNumber}?placed=1`);
    });
  }

  const blocking = quote?.errors ?? [];
  const canPlace = shop.isOpen && blocking.length === 0 && !!quote && !quoting;

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-6">
        {shop.deliveryEnabled && shop.takeawayEnabled && (
          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">How would you like your order?</h2>
            <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Order type">
              {(
                [
                  { value: "DELIVERY", label: "Delivery", icon: Bike },
                  { value: "TAKEAWAY", label: "Takeaway", icon: ShoppingBag },
                ] as const
              ).map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={type === value}
                  onClick={() => setType(value)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-semibold transition-colors",
                    type === value
                      ? "border-brand-600 bg-brand-50 text-brand-800"
                      : "border-stone-200 text-stone-700 hover:bg-stone-50",
                  )}
                >
                  <Icon className="size-4" /> {label}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="font-semibold">Your details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="customerName" error={errors.customerName}>
              <Input id="customerName" autoComplete="name" value={form.customerName} onChange={set("customerName")} required />
            </Field>
            <Field label="Mobile number" htmlFor="customerPhone" error={errors.customerPhone}>
              <Input
                id="customerPhone"
                type="tel"
                inputMode="numeric"
                autoComplete="tel-national"
                placeholder="98765 43210"
                value={form.customerPhone}
                onChange={set("customerPhone")}
                required
              />
            </Field>
            <Field label="Email (optional)" htmlFor="customerEmail" error={errors.customerEmail} className="sm:col-span-2">
              <Input id="customerEmail" type="email" autoComplete="email" value={form.customerEmail} onChange={set("customerEmail")} />
            </Field>
          </div>
          {!isLoggedIn && (
            <p className="text-xs text-stone-500">
              Ordering as a guest.{" "}
              <Link href="/login?callbackUrl=/checkout" className="font-medium text-brand-700 hover:underline">
                Log in
              </Link>{" "}
              to see your order history.
            </p>
          )}
        </section>

        {type === "DELIVERY" ? (
          <section className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
            <h2 className="font-semibold">Delivery address</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="House / flat, street" htmlFor="addressLine" error={errors.addressLine} className="sm:col-span-2">
                <Input id="addressLine" autoComplete="street-address" value={form.addressLine} onChange={set("addressLine")} />
              </Field>
              <Field label="Area / locality" htmlFor="area" error={errors.area}>
                <Input id="area" value={form.area} onChange={set("area")} />
              </Field>
              <Field label="Landmark (optional)" htmlFor="landmark" error={errors.landmark}>
                <Input id="landmark" value={form.landmark} onChange={set("landmark")} />
              </Field>
              <Field label="City" htmlFor="city" error={errors.city}>
                <Input id="city" autoComplete="address-level2" value={form.city} onChange={set("city")} />
              </Field>
              <Field label="Pincode" htmlFor="pincode" error={errors.pincode}>
                <Input
                  id="pincode"
                  inputMode="numeric"
                  maxLength={6}
                  autoComplete="postal-code"
                  value={form.pincode}
                  onChange={set("pincode")}
                />
              </Field>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm">
            <h2 className="mb-1 font-semibold">Pickup from</h2>
            <p className="text-stone-600">
              {shop.addressLine}, {shop.city}
            </p>
          </section>
        )}

        <section className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
          <Field label="Cooking instructions (optional)" htmlFor="notes" error={errors.notes}>
            <Textarea id="notes" maxLength={300} placeholder="Less spicy, no onions…" value={form.notes} onChange={set("notes")} />
          </Field>
        </section>
      </div>

      <aside className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-5 lg:sticky lg:top-20">
        <h2 className="font-semibold">Order summary</h2>

        <ul className="space-y-2 text-sm">
          {(quote?.lines ?? []).map((l, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="text-stone-700">
                {l.quantity} × {l.productName}
                {(l.variantName || l.addons.length > 0) && (
                  <span className="block text-xs text-stone-500">
                    {[l.variantName, ...l.addons].filter(Boolean).join(" · ")}
                  </span>
                )}
              </span>
              <span className="shrink-0 font-medium">{formatINR(l.lineTotal)}</span>
            </li>
          ))}
        </ul>

        <div>
          {coupon && quote?.couponCode ? (
            <div className="flex items-center justify-between rounded-xl bg-green-50 px-3 py-2 text-sm text-green-800">
              <span className="flex items-center gap-2 font-medium">
                <Tag className="size-4" /> {quote.couponCode} applied
              </span>
              <button
                type="button"
                onClick={() => {
                  setCoupon(null);
                  setCouponInput("");
                }}
                className="rounded p-1 hover:bg-green-100"
                aria-label="Remove coupon"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                aria-label="Coupon code"
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={applyCoupon} disabled={!couponInput.trim() || quoting}>
                Apply
              </Button>
            </div>
          )}
        </div>

        {quote ? (
          <dl className="space-y-1.5 border-t border-stone-100 pt-3 text-sm">
            <Row label="Subtotal" value={formatINR(quote.subtotal)} />
            {quote.discount > 0 && <Row label="Discount" value={`− ${formatINR(quote.discount)}`} className="text-green-700" />}
            {type === "DELIVERY" && (
              <Row label="Delivery fee" value={quote.deliveryFee === 0 ? "Free" : formatINR(quote.deliveryFee)} />
            )}
            {quote.tax > 0 && <Row label="Taxes" value={formatINR(quote.tax)} />}
            <Row label="Total" value={formatINR(quote.total)} className="border-t border-stone-100 pt-2 text-base font-bold" />
          </dl>
        ) : (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Loader2 className="size-4 animate-spin" /> Calculating…
          </div>
        )}

        {blocking.length > 0 && (
          <ul className="space-y-1 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
            {blocking.map((err) => (
              <li key={err} className="flex gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0" /> {err}
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
          <p className="font-medium">Payment: Cash on {type === "DELIVERY" ? "delivery" : "pickup"}</p>
          <p className="text-xs text-stone-500">Pay when you receive your order.</p>
        </div>

        <Button type="submit" size="lg" className="w-full" loading={placing} disabled={!canPlace}>
          {quote ? `Place order · ${formatINR(quote.total)}` : "Place order"}
        </Button>
        {!shop.isOpen && <p className="text-center text-xs text-stone-500">{shop.closedReason}</p>}
      </aside>
    </form>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className="text-stone-600">{label}</dt>
      <dd className="font-medium text-stone-900">{value}</dd>
    </div>
  );
}
