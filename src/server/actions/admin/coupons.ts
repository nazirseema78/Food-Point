"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/utils";
import { couponSchema } from "@/lib/validators/coupon";
import { fieldErrors, firstError } from "@/lib/validators/common";
import { requireAdmin } from "@/server/auth-guard";

export async function saveCoupon(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = couponSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const data = {
    ...parsed.data,
    maxDiscount: parsed.data.type === "PERCENT" ? (parsed.data.maxDiscount ?? null) : null,
    usageLimit: parsed.data.usageLimit ?? null,
  };

  try {
    const coupon = id
      ? await db.coupon.update({ where: { id }, data })
      : await db.coupon.create({ data });
    revalidatePath("/admin/coupons");
    return { ok: true, data: { id: coupon.id }, message: "Coupon saved" };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false, error: "A coupon with this code already exists", fieldErrors: { code: ["Already exists"] } };
    throw e;
  }
}

export async function setCouponActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.coupon.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/coupons");
  return { ok: true, data: undefined };
}
