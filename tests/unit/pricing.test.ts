import { describe, expect, it } from "vitest";
import { calculateOrder, evaluateCoupon, type CouponRule, type PricingLine } from "@/lib/pricing";

const NOW = new Date("2026-10-19T12:00:00Z");

const settings = { deliveryFee: 3000, freeDeliveryAbove: 39900, minOrder: 9900, taxRateBps: 0 };

const burger: PricingLine = {
  productId: "p1",
  productName: "Burger",
  basePrice: 9900,
  addons: [],
  quantity: 2,
};

const coupon = (over: Partial<CouponRule> = {}): CouponRule => ({
  code: "TEST",
  type: "FLAT",
  value: 5000,
  minOrder: 0,
  usedCount: 0,
  isActive: true,
  ...over,
});

describe("calculateOrder", () => {
  it("adds add-ons to the unit price and multiplies by quantity", () => {
    const res = calculateOrder({
      lines: [{ ...burger, addons: [{ name: "Cheese", price: 2000 }, { name: "Jalapeño", price: 1500 }] }],
      type: "TAKEAWAY",
      settings,
      now: NOW,
    });
    expect(res.lines[0].unitPrice).toBe(13400);
    expect(res.lines[0].lineTotal).toBe(26800);
    expect(res.subtotal).toBe(26800);
    expect(res.total).toBe(26800);
  });

  it("charges delivery fee below the free-delivery threshold", () => {
    const res = calculateOrder({ lines: [burger], type: "DELIVERY", settings, now: NOW });
    expect(res.deliveryFee).toBe(3000);
    expect(res.total).toBe(19800 + 3000);
  });

  it("waives delivery fee at or above the threshold", () => {
    const res = calculateOrder({ lines: [{ ...burger, basePrice: 19950 }], type: "DELIVERY", settings, now: NOW });
    expect(res.subtotal).toBe(39900);
    expect(res.deliveryFee).toBe(0);
  });

  it("never charges delivery for takeaway", () => {
    const res = calculateOrder({ lines: [burger], type: "TAKEAWAY", settings, now: NOW });
    expect(res.deliveryFee).toBe(0);
  });

  it("flags orders below the minimum", () => {
    const res = calculateOrder({ lines: [{ ...burger, quantity: 1, basePrice: 5000 }], type: "TAKEAWAY", settings, now: NOW });
    expect(res.errors).toContain("Minimum order is ₹99");
  });

  it("flags an empty cart", () => {
    const res = calculateOrder({ lines: [], type: "TAKEAWAY", settings, now: NOW });
    expect(res.errors).toContain("Your cart is empty");
  });

  it("applies tax after discount, rounded to the nearest paisa", () => {
    const res = calculateOrder({
      lines: [burger],
      type: "TAKEAWAY",
      settings: { ...settings, taxRateBps: 500 },
      coupon: coupon({ value: 1000 }),
      now: NOW,
    });
    // (19800 - 1000) * 5% = 940
    expect(res.discount).toBe(1000);
    expect(res.tax).toBe(940);
    expect(res.total).toBe(18800 + 940);
  });

  it("reports coupon errors without blocking totals", () => {
    const res = calculateOrder({
      lines: [burger],
      type: "TAKEAWAY",
      settings,
      coupon: coupon({ isActive: false }),
      now: NOW,
    });
    expect(res.discount).toBe(0);
    expect(res.couponError).toBe("This coupon is not active");
  });
});

describe("evaluateCoupon", () => {
  it("applies a flat discount", () => {
    expect(evaluateCoupon(coupon(), 20000, NOW)).toEqual({ ok: true, discount: 5000 });
  });

  it("never discounts more than the subtotal", () => {
    expect(evaluateCoupon(coupon({ value: 99999 }), 20000, NOW)).toEqual({ ok: true, discount: 20000 });
  });

  it("applies a percentage discount, floored, and caps at maxDiscount", () => {
    expect(evaluateCoupon(coupon({ type: "PERCENT", value: 10 }), 19999, NOW)).toEqual({ ok: true, discount: 1999 });
    expect(evaluateCoupon(coupon({ type: "PERCENT", value: 50, maxDiscount: 7500 }), 40000, NOW)).toEqual({
      ok: true,
      discount: 7500,
    });
  });

  it("enforces minimum order", () => {
    const res = evaluateCoupon(coupon({ minOrder: 29900 }), 25000, NOW);
    expect(res).toEqual({ ok: false, reason: "Add ₹49 more to use this coupon" });
  });

  it("enforces start and expiry dates", () => {
    expect(evaluateCoupon(coupon({ startsAt: new Date("2026-11-01") }), 20000, NOW).ok).toBe(false);
    expect(evaluateCoupon(coupon({ expiresAt: new Date("2026-10-01") }), 20000, NOW).ok).toBe(false);
  });

  it("enforces usage limit", () => {
    expect(evaluateCoupon(coupon({ usageLimit: 5, usedCount: 5 }), 20000, NOW)).toEqual({
      ok: false,
      reason: "This coupon has reached its usage limit",
    });
  });
});
