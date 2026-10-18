import { z } from "zod";
import { DAY_KEYS } from "@/lib/hours";
import { indianPhone, optionalText, paise } from "./common";

const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM");

const dayHours = z.object({ open: time, close: time, closed: z.boolean() });

export const settingsSchema = z.object({
  name: z.string().trim().min(1, "Shop name is required").max(80),
  phone: indianPhone,
  email: z
    .union([z.string().trim().email("Invalid email"), z.literal(""), z.null()])
    .optional()
    .transform((v) => v || null),
  addressLine: z.string().trim().min(1, "Address is required").max(200),
  city: z.string().trim().min(1, "City is required").max(60),
  logoUrl: optionalText(500),
  acceptingOrders: z.boolean(),
  deliveryEnabled: z.boolean(),
  takeawayEnabled: z.boolean(),
  deliveryFee: paise,
  freeDeliveryAbove: paise.nullable().optional(),
  minOrder: paise,
  taxRateBps: z.number().int().min(0).max(5000),
  openingHours: z.object(
    Object.fromEntries(DAY_KEYS.map((d) => [d, dayHours])) as Record<
      (typeof DAY_KEYS)[number],
      typeof dayHours
    >,
  ),
});
export type SettingsInput = z.input<typeof settingsSchema>;
