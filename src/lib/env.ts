import "server-only";
import { z } from "zod";

// Validated lazily so pages that don't need a given service still build.

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  CLOUDINARY_UPLOAD_FOLDER: z.string().min(1).default("food-point"),
});

export function cloudinaryEnv() {
  const parsed = cloudinarySchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env.local",
    );
  }
  return parsed.data;
}

export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}
