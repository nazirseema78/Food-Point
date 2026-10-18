import "server-only";
import { Prisma, type OrderStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { calculateOrder } from "@/lib/pricing";
import { canTransition } from "@/lib/order-status";
import type { checkoutSchema, quoteSchema } from "@/lib/validators/checkout";
import type { z } from "zod";
import { resolveCart } from "@/server/cart";
import { getBranch, getShopStatus } from "@/server/queries/branch";
import { generateOrderNumber } from "@/server/order-access";
import { notifyNewOrder, notifyStatusChange } from "@/server/notify";

type QuoteData = z.output<typeof quoteSchema>;
type CheckoutData = z.output<typeof checkoutSchema>;

export class OrderError extends Error {}

/** Server-authoritative totals for the cart. */
export async function buildQuote(input: QuoteData, now: Date = new Date()) {
  const branch = await getBranch();
  const { lines, errors: cartErrors } = await resolveCart(input.items);

  const coupon = input.couponCode
    ? await db.coupon.findUnique({ where: { code: input.couponCode } })
    : null;

  const calc = calculateOrder({
    lines,
    type: input.type,
    settings: branch,
    coupon,
    now,
  });

  const errors = [...cartErrors, ...calc.errors];
  if (input.type === "DELIVERY" && !branch.deliveryEnabled)
    errors.push("Delivery is not available right now");
  if (input.type === "TAKEAWAY" && !branch.takeawayEnabled)
    errors.push("Takeaway is not available right now");
  const shop = getShopStatus(branch, now);
  if (!shop.isOpen) errors.push(shop.reason ?? "We are closed right now");

  const couponError =
    input.couponCode && !coupon ? "Invalid coupon code" : calc.couponError;

  return {
    branch,
    coupon: coupon && !couponError ? coupon : null,
    calc: { ...calc, couponError },
    errors,
  };
}

export async function createOrder(input: CheckoutData, userId: string | null) {
  const { branch, coupon, calc, errors } = await buildQuote(input);
  if (errors.length > 0) throw new OrderError(errors[0]);
  if (input.couponCode && calc.couponError) throw new OrderError(calc.couponError);

  for (let attempt = 0; attempt < 3; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      const order = await db.$transaction(async (tx) => {
        if (coupon) {
          // Conditional increment guards the usage limit against concurrent orders.
          const updated = await tx.coupon.updateMany({
            where: {
              id: coupon.id,
              isActive: true,
              ...(coupon.usageLimit != null ? { usedCount: { lt: coupon.usageLimit } } : {}),
            },
            data: { usedCount: { increment: 1 } },
          });
          if (updated.count === 0) throw new OrderError("This coupon has reached its usage limit");
        }

        return tx.order.create({
          data: {
            orderNumber,
            branchId: branch.id,
            userId,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail,
            type: input.type,
            addressLine: input.type === "DELIVERY" ? input.addressLine : null,
            area: input.type === "DELIVERY" ? input.area : null,
            city: input.type === "DELIVERY" ? input.city : null,
            pincode: input.type === "DELIVERY" ? input.pincode : null,
            landmark: input.type === "DELIVERY" ? input.landmark : null,
            notes: input.notes,
            subtotal: calc.subtotal,
            discount: calc.discount,
            deliveryFee: calc.deliveryFee,
            tax: calc.tax,
            total: calc.total,
            couponId: coupon?.id ?? null,
            couponCode: coupon?.code ?? null,
            paymentMethod: "COD",
            items: {
              create: calc.lines.map((l) => ({
                productId: l.productId,
                productName: l.productName,
                variantName: l.variantName ?? null,
                addons: l.addons,
                unitPrice: l.unitPrice,
                quantity: l.quantity,
                lineTotal: l.lineTotal,
              })),
            },
            events: { create: { status: "PENDING" } },
          },
        });
      });

      await notifyNewOrder({
        orderNumber: order.orderNumber,
        customerPhone: order.customerPhone,
        total: order.total,
      });
      return order;
    } catch (e) {
      const collision =
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002" &&
        String(e.meta?.target ?? "").includes("orderNumber");
      if (!collision) throw e;
    }
  }
  throw new OrderError("Could not place the order. Please try again.");
}

export async function changeOrderStatus(orderId: string, to: OrderStatus, note?: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) throw new OrderError("Order not found");
  if (!canTransition(order.type, order.status, to))
    throw new OrderError(`Cannot move order from ${order.status} to ${to}`);

  const updated = await db.$transaction(async (tx) => {
    if (to === "CANCELLED" && order.couponId) {
      await tx.coupon.updateMany({
        where: { id: order.couponId, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }
    // Cash is collected on handover.
    const paid = to === "DELIVERED" || to === "COMPLETED";
    return tx.order.update({
      where: { id: orderId, status: order.status },
      data: {
        status: to,
        ...(paid ? { paymentStatus: "PAID" as const } : {}),
        events: { create: { status: to, note: note || null } },
      },
    });
  });

  await notifyStatusChange({
    orderNumber: updated.orderNumber,
    customerPhone: updated.customerPhone,
    total: updated.total,
    status: to,
  });
  return updated;
}
