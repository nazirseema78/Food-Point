import { z } from "zod";
import { optionalDate, optionalText, paise } from "./common";

export const couponCode = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9_-]{3,20}$/, "Use 3–20 letters, numbers, - or _");

export const couponSchema = z
  .object({
    code: couponCode,
    description: optionalText(200),
    type: z.enum(["FLAT", "PERCENT"]),
    value: z.number().int().min(1, "Value must be at least 1"),
    maxDiscount: paise.nullable().optional(),
    minOrder: paise.default(0),
    startsAt: optionalDate,
    expiresAt: optionalDate,
    usageLimit: z.number().int().min(1).nullable().optional(),
    isActive: z.boolean().default(true),
  })
  .refine((c) => c.type !== "PERCENT" || c.value <= 100, {
    message: "Percentage cannot exceed 100",
    path: ["value"],
  })
  .refine((c) => !c.startsAt || !c.expiresAt || c.startsAt < c.expiresAt, {
    message: "Expiry must be after start",
    path: ["expiresAt"],
  });
export type CouponInput = z.input<typeof couponSchema>;
