import type { OrderStatus, OrderType } from "@prisma/client";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Order placed",
  CONFIRMED: "Confirmed",
  PREPARING: "Preparing",
  READY: "Ready for pickup",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Picked up",
  CANCELLED: "Cancelled",
};

const FLOW: Record<OrderType, OrderStatus[]> = {
  DELIVERY: ["PENDING", "CONFIRMED", "PREPARING", "OUT_FOR_DELIVERY", "DELIVERED"],
  TAKEAWAY: ["PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED"],
};

export const FINAL_STATUSES: OrderStatus[] = ["DELIVERED", "COMPLETED", "CANCELLED"];

export function statusFlow(type: OrderType): OrderStatus[] {
  return FLOW[type];
}

export function isFinal(status: OrderStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

export function nextStatus(type: OrderType, current: OrderStatus): OrderStatus | null {
  const flow = FLOW[type];
  const i = flow.indexOf(current);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

/** Forward-only along the flow; cancel allowed from any non-final state. */
export function canTransition(type: OrderType, from: OrderStatus, to: OrderStatus): boolean {
  if (isFinal(from)) return false;
  if (to === "CANCELLED") return true;
  const flow = FLOW[type];
  const fromIdx = flow.indexOf(from);
  const toIdx = flow.indexOf(to);
  return fromIdx >= 0 && toIdx > fromIdx;
}
