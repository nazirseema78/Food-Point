import { z } from "zod";
import { normalizeIndianPhone } from "@/lib/utils";

export const paise = z.number().int("Must be a whole amount").min(0, "Cannot be negative").max(10_000_000);

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((v) => (v ? v : null));

export const indianPhone = z
  .string()
  .trim()
  .transform((v, ctx) => {
    const phone = normalizeIndianPhone(v);
    if (!phone) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Enter a valid 10-digit mobile number" });
      return z.NEVER;
    }
    return phone;
  });

export const optionalDate = z
  .union([z.string(), z.date(), z.null(), z.undefined()])
  .transform((v, ctx) => {
    if (v == null || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    if (Number.isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

export function fieldErrors(error: z.ZodError): Record<string, string[] | undefined> {
  return error.flatten().fieldErrors as Record<string, string[] | undefined>;
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}
