import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/server/auth-guard";
import { cloudinaryEnv } from "@/lib/env";

// Returns a short-lived signature so the browser can upload straight to Cloudinary
// without ever seeing the API secret.
export async function POST() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let env;
  try {
    env = cloudinaryEnv();
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

  const timestamp = Math.round(Date.now() / 1000);
  const params = { timestamp, folder: env.CLOUDINARY_UPLOAD_FOLDER };
  const signature = cloudinary.utils.api_sign_request(params, env.CLOUDINARY_API_SECRET);

  return NextResponse.json({
    signature,
    timestamp,
    folder: env.CLOUDINARY_UPLOAD_FOLDER,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
  });
}
