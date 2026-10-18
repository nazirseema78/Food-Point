"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/utils";
import { checkoutSchema, quoteSchema, trackSchema } from "@/lib/validators/checkout";
import { fieldErrors, firstError } from "@/lib/validators/common";
import { buildQuote, createOrder, OrderError } from "@/server/order-service";
import { grantOrderAccess } from "@/server/order-access";
import { currentUser } from "@/server/auth-guard";

export type Quote = {
  lines: { productName: string; variantName: string | null; addons: string[]; quantity: number; lineTotal: number }[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponError?: string;
  errors: string[];
};

export async function quoteOrder(input: unknown): Promise<ActionResult<Quote>> {
  const parsed = quoteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstError(parsed.error) };

  const { calc, coupon, errors } = await buildQuote(parsed.data);
  return {
    ok: true,
    data: {
      lines: calc.lines.map((l) => ({
        productName: l.productName,
        variantName: l.variantName ?? null,
        addons: l.addons.map((a) => a.name),
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
      subtotal: calc.subtotal,
      discount: calc.discount,
      deliveryFee: calc.deliveryFee,
      tax: calc.tax,
      total: calc.total,
      couponCode: coupon?.code ?? null,
      couponError: calc.couponError,
      errors,
    },
  };
}

export async function placeOrder(input: unknown): Promise<ActionResult<{ orderNumber: string }>> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const user = await currentUser();
  try {
    const order = await createOrder(parsed.data, user?.id ?? null);
    await grantOrderAccess(order.orderNumber);
    revalidatePath("/admin");
    return { ok: true, data: { orderNumber: order.orderNumber } };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    throw e;
  }
}

export type TrackState = { error?: string } | null;

export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const parsed = trackSchema.safeParse({
    orderNumber: formData.get("orderNumber"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: firstError(parsed.error) };

  const order = await db.order.findUnique({
    where: { orderNumber: parsed.data.orderNumber },
    select: { orderNumber: true, customerPhone: true },
  });
  // Same message for both cases so order numbers can't be probed.
  if (!order || order.customerPhone !== parsed.data.phone)
    return { error: "No order found with these details" };

  await grantOrderAccess(order.orderNumber);
  redirect(`/orders/${order.orderNumber}`);
}
