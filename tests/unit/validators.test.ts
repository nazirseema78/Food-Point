import { describe, expect, it } from "vitest";
import { formatINR, rupeesToPaise } from "@/lib/money";
import { normalizeIndianPhone, slugify } from "@/lib/utils";
import { checkoutSchema } from "@/lib/validators/checkout";
import { couponSchema } from "@/lib/validators/coupon";
import { productSchema } from "@/lib/validators/catalog";

describe("money", () => {
  it("formats paise as INR", () => {
    expect(formatINR(14900)).toBe("₹149");
    expect(formatINR(14950)).toBe("₹149.50");
    expect(formatINR(12345600)).toBe("₹1,23,456");
  });
  it("converts rupees to paise without float drift", () => {
    expect(rupeesToPaise("19.99")).toBe(1999);
    expect(rupeesToPaise(0.1 + 0.2)).toBe(30);
  });
});

describe("utils", () => {
  it("normalises Indian mobile numbers", () => {
    expect(normalizeIndianPhone("+91 98765 43210")).toBe("9876543210");
    expect(normalizeIndianPhone("09876543210")).toBe("9876543210");
    expect(normalizeIndianPhone("12345")).toBeNull();
    expect(normalizeIndianPhone("5876543210")).toBeNull();
  });
  it("slugifies names", () => {
    expect(slugify('Margherita Pizza (10")')).toBe("margherita-pizza-10");
  });
});

describe("checkoutSchema", () => {
  const base = {
    items: [{ productId: "p1", addonIds: [], quantity: 1 }],
    customerName: "Asha",
    customerPhone: "98765 43210",
  };

  it("requires an address for delivery", () => {
    const res = checkoutSchema.safeParse({ ...base, type: "DELIVERY" });
    expect(res.success).toBe(false);
    const paths = res.error?.issues.map((i) => i.path[0]);
    expect(paths).toEqual(expect.arrayContaining(["addressLine", "city", "pincode"]));
  });

  it("accepts takeaway without an address and normalises phone", () => {
    const res = checkoutSchema.safeParse({ ...base, type: "TAKEAWAY" });
    expect(res.success).toBe(true);
    expect(res.data?.customerPhone).toBe("9876543210");
  });

  it("rejects silly quantities", () => {
    const res = checkoutSchema.safeParse({ ...base, type: "TAKEAWAY", items: [{ productId: "p1", quantity: 500 }] });
    expect(res.success).toBe(false);
  });
});

describe("couponSchema", () => {
  it("uppercases codes and rejects >100%", () => {
    expect(couponSchema.safeParse({ code: "save10", type: "PERCENT", value: 10 }).data?.code).toBe("SAVE10");
    expect(couponSchema.safeParse({ code: "BIG", type: "PERCENT", value: 150 }).success).toBe(false);
  });
});

describe("productSchema", () => {
  const product = {
    name: "Pizza",
    categoryId: "c1",
    basePrice: 19900,
    isVeg: true,
    isAvailable: true,
    isFeatured: false,
    images: [],
    variants: [],
    addonGroups: [],
  };

  it("rejects fractional paise", () => {
    expect(productSchema.safeParse({ ...product, basePrice: 199.5 }).success).toBe(false);
  });

  it("rejects add-on groups whose min exceeds max", () => {
    const res = productSchema.safeParse({
      ...product,
      addonGroups: [{ name: "Crust", minSelect: 2, maxSelect: 1, addons: [{ name: "Thin", price: 0 }] }],
    });
    expect(res.success).toBe(false);
  });
});
