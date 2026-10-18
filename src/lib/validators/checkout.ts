import { z } from "zod";
import { indianPhone, optionalText } from "./common";

export const cartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().min(1).nullable().optional(),
  addonIds: z.array(z.string().min(1)).max(40).default([]),
  quantity: z.number().int().min(1).max(50),
});
export type CartItemInput = z.input<typeof cartItemSchema>;

export const quoteSchema = z.object({
  items: z.array(cartItemSchema).min(1, "Your cart is empty").max(50),
  type: z.enum(["DELIVERY", "TAKEAWAY"]),
  couponCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(20)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

export const checkoutSchema = quoteSchema
  .extend({
    customerName: z.string().trim().min(2, "Enter your name").max(60),
    customerPhone: indianPhone,
    customerEmail: z
      .union([z.string().trim().email("Invalid email"), z.literal(""), z.null()])
      .optional()
      .transform((v) => v || null),
    addressLine: optionalText(200),
    area: optionalText(100),
    city: optionalText(60),
    pincode: optionalText(6),
    landmark: optionalText(100),
    notes: optionalText(300),
  })
  .superRefine((v, ctx) => {
    if (v.type !== "DELIVERY") return;
    if (!v.addressLine)
      ctx.addIssue({ code: "custom", path: ["addressLine"], message: "Enter your delivery address" });
    if (!v.city) ctx.addIssue({ code: "custom", path: ["city"], message: "Enter your city" });
    if (!v.pincode || !/^\d{6}$/.test(v.pincode))
      ctx.addIssue({ code: "custom", path: ["pincode"], message: "Enter a 6-digit pincode" });
  });
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const trackSchema = z.object({
  orderNumber: z.string().trim().toUpperCase().min(4).max(30),
  phone: indianPhone,
});
