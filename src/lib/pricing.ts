// The single source of truth for order maths. Pure: no DB, no Date.now().
// Used by the checkout quote and by order creation on the server.

export type OrderTypeValue = "DELIVERY" | "TAKEAWAY";

export type PricedAddon = { name: string; price: number };

export type PricingLine = {
  productId: string;
  productName: string;
  variantName?: string | null;
  /** Variant price, or product base price when there are no variants. */
  basePrice: number;
  addons: PricedAddon[];
  quantity: number;
};

export type CouponRule = {
  code: string;
  type: "FLAT" | "PERCENT";
  value: number;
  maxDiscount?: number | null;
  minOrder: number;
  startsAt?: Date | null;
  expiresAt?: Date | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
};

export type PricingSettings = {
  deliveryFee: number;
  freeDeliveryAbove?: number | null;
  minOrder: number;
  taxRateBps: number;
};

export type CouponResult =
  | { ok: true; discount: number }
  | { ok: false; reason: string };

export function evaluateCoupon(coupon: CouponRule, subtotal: number, now: Date): CouponResult {
  if (!coupon.isActive) return { ok: false, reason: "This coupon is not active" };
  if (coupon.startsAt && now < coupon.startsAt)
    return { ok: false, reason: "This coupon is not valid yet" };
  if (coupon.expiresAt && now > coupon.expiresAt)
    return { ok: false, reason: "This coupon has expired" };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit)
    return { ok: false, reason: "This coupon has reached its usage limit" };
  if (subtotal < coupon.minOrder)
    return {
      ok: false,
      reason: `Add ₹${Math.ceil((coupon.minOrder - subtotal) / 100)} more to use this coupon`,
    };

  let discount =
    coupon.type === "FLAT" ? coupon.value : Math.floor((subtotal * coupon.value) / 100);
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(discount, subtotal));
  return { ok: true, discount };
}

export type PricedLine = PricingLine & { unitPrice: number; lineTotal: number };

export type OrderCalculation = {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponError?: string;
  /** Problems that block placing the order (e.g. below minimum). */
  errors: string[];
};

export function calculateOrder(input: {
  lines: PricingLine[];
  type: OrderTypeValue;
  settings: PricingSettings;
  coupon?: CouponRule | null;
  now: Date;
}): OrderCalculation {
  const { settings, type, coupon, now } = input;
  const errors: string[] = [];

  const lines: PricedLine[] = input.lines.map((line) => {
    const unitPrice = line.basePrice + line.addons.reduce((sum, a) => sum + a.price, 0);
    return { ...line, unitPrice, lineTotal: unitPrice * line.quantity };
  });

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  if (lines.length === 0) errors.push("Your cart is empty");
  if (subtotal < settings.minOrder)
    errors.push(`Minimum order is ₹${settings.minOrder / 100}`);

  let discount = 0;
  let couponError: string | undefined;
  if (coupon) {
    const result = evaluateCoupon(coupon, subtotal, now);
    if (result.ok) discount = result.discount;
    else couponError = result.reason;
  }

  const freeDelivery =
    settings.freeDeliveryAbove != null && subtotal >= settings.freeDeliveryAbove;
  const deliveryFee = type === "DELIVERY" && !freeDelivery ? settings.deliveryFee : 0;

  const taxable = subtotal - discount;
  const tax = Math.round((taxable * settings.taxRateBps) / 10000);
  const total = taxable + tax + deliveryFee;

  return { lines, subtotal, discount, deliveryFee, tax, total, couponError, errors };
}
