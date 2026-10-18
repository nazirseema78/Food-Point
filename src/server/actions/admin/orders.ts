"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/lib/utils";
import { requireAdmin } from "@/server/auth-guard";
import { changeOrderStatus, OrderError } from "@/server/order-service";

const statusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PREPARING",
    "READY",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "COMPLETED",
    "CANCELLED",
  ]),
  note: z.string().trim().max(200).optional(),
});

export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = statusSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request" };

  try {
    const order = await changeOrderStatus(parsed.data.orderId, parsed.data.status, parsed.data.note);
    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${order.id}`);
    revalidatePath(`/orders/${order.orderNumber}`);
    return { ok: true, data: undefined };
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    // Status changed concurrently (another tab) — where clause on status didn't match.
    return { ok: false, error: "Order was updated elsewhere. Refresh and try again." };
  }
}
