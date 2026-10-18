import { z } from "zod";
import { indianPhone } from "./common";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(1, "Enter your password"),
});

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(60),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.union([indianPhone, z.literal("").transform(() => null)]).optional(),
  password: z.string().min(8, "Use at least 8 characters").max(100),
});

export type RegisterInput = z.input<typeof registerSchema>;
