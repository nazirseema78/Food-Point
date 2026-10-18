import "server-only";
import type { OrderStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { startOfTodayIST } from "@/lib/hours";
import { FINAL_STATUSES } from "@/lib/order-status";
import { currentUser } from "@/server/auth-guard";
import { getAccessibleOrderNumbers } from "@/server/order-access";

const orderInclude = {
  items: true,
  events: { orderBy: { createdAt: "asc" } },
} satisfies Prisma.OrderInclude;

export type FullOrder = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

/** Returns the order only if the current visitor may see it. */
export async function getOrderForViewer(orderNumber: string): Promise<FullOrder | null> {
  const order = await db.order.findUnique({ where: { orderNumber }, include: orderInclude });
  if (!order) return null;
  const user = await currentUser();
  if (user?.role === "ADMIN") return order;
  if (user && order.userId === user.id) return order;
  const allowed = await getAccessibleOrderNumbers();
  return allowed.includes(orderNumber) ? order : null;
}

export async function getOrderById(id: string) {
  return db.order.findUnique({ where: { id }, include: orderInclude });
}

export async function getUserOrders(userId: string) {
  return db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { items: { select: { productName: true, quantity: true } } },
  });
}

export type BoardOrder = Awaited<ReturnType<typeof getBoardOrders>>[number];

/** Admin board: all open orders plus today's finished ones. */
export async function getBoardOrders() {
  const today = startOfTodayIST();
  return db.order.findMany({
    where: {
      OR: [{ status: { notIn: FINAL_STATUSES } }, { createdAt: { gte: today } }],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerPhone: true,
      type: true,
      status: true,
      total: true,
      createdAt: true,
      area: true,
      notes: true,
      items: { select: { productName: true, variantName: true, quantity: true, addons: true } },
    },
  });
}

export async function getDashboardStats() {
  const today = startOfTodayIST();
  const [todayOrders, pending, revenue, recent] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
    db.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING", "READY", "OUT_FOR_DELIVERY"] satisfies OrderStatus[] } } }),
    db.order.aggregate({
      where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, customerName: true, total: true, status: true, type: true, createdAt: true },
    }),
  ]);
  return { todayOrders, pending, todayRevenue: revenue._sum.total ?? 0, recent };
}
