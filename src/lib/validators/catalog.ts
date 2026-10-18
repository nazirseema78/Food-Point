import { z } from "zod";
import { optionalText, paise } from "./common";

const imageUrl = z
  .string()
  .trim()
  .url("Invalid image URL")
  .max(500);

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  description: optionalText(300),
  imageUrl: z
    .union([imageUrl, z.literal(""), z.null()])
    .optional()
    .transform((v) => v || null),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
});
export type CategoryInput = z.input<typeof categorySchema>;

const addonSchema = z.object({
  name: z.string().trim().min(1, "Add-on name is required").max(60),
  price: paise,
  isAvailable: z.boolean().default(true),
});

const addonGroupSchema = z
  .object({
    name: z.string().trim().min(1, "Group name is required").max(60),
    minSelect: z.number().int().min(0).max(20),
    maxSelect: z.number().int().min(1).max(20),
    addons: z.array(addonSchema).min(1, "Each add-on group needs at least one option").max(30),
  })
  .refine((g) => g.minSelect <= g.maxSelect, {
    message: "Min choices cannot exceed max choices",
    path: ["minSelect"],
  })
  .refine((g) => g.minSelect <= g.addons.length, {
    message: "Min choices cannot exceed number of options",
    path: ["minSelect"],
  });

export const productSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  description: optionalText(500),
  categoryId: z.string().min(1, "Choose a category"),
  basePrice: paise,
  isVeg: z.boolean(),
  isAvailable: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  images: z
    .array(z.object({ url: imageUrl, publicId: z.string().max(200).nullable().optional() }))
    .max(8, "Up to 8 images"),
  variants: z
    .array(z.object({ name: z.string().trim().min(1, "Size name is required").max(40), price: paise }))
    .max(10),
  addonGroups: z.array(addonGroupSchema).max(10),
});
export type ProductInput = z.input<typeof productSchema>;
