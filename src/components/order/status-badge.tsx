import type { OrderStatus } from "@prisma/client";
import { STATUS_LABELS } from "@/lib/order-status";
import { Badge } from "@/components/ui/badge";

const VARIANT: Record<OrderStatus, "default" | "brand" | "success" | "warning" | "danger" | "info"> = {
  PENDING: "warning",
  CONFIRMED: "info",
  PREPARING: "brand",
  READY: "success",
  OUT_FOR_DELIVERY: "info",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={VARIANT[status]}>{STATUS_LABELS[status]}</Badge>;
}
