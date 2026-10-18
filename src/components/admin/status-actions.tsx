"use client";

import { useTransition } from "react";
import type { OrderStatus, OrderType } from "@prisma/client";
import { toast } from "sonner";
import { updateOrderStatus } from "@/server/actions/admin/orders";
import { STATUS_LABELS, isFinal, nextStatus } from "@/lib/order-status";
import { Button } from "@/components/ui/button";

const NEXT_LABEL: Partial<Record<OrderStatus, string>> = {
  CONFIRMED: "Accept order",
  PREPARING: "Start preparing",
  READY: "Mark ready",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Mark delivered",
  COMPLETED: "Mark picked up",
};

export function StatusActions({
  orderId,
  type,
  status,
  onChanged,
  size = "sm",
}: {
  orderId: string;
  type: OrderType;
  status: OrderStatus;
  onChanged?: () => void;
  size?: "sm" | "default";
}) {
  const [pending, start] = useTransition();
  if (isFinal(status)) return null;
  const next = nextStatus(type, status);

  function change(to: OrderStatus) {
    let note: string | undefined;
    if (to === "CANCELLED") {
      const reason = prompt("Cancel this order? Enter a reason for the customer (optional):");
      if (reason === null) return;
      note = reason;
    }
    start(async () => {
      const res = await updateOrderStatus({ orderId, status: to, note });
      if (!res.ok) toast.error(res.error);
      else toast.success(`Order ${STATUS_LABELS[to].toLowerCase()}`);
      onChanged?.();
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {next && (
        <Button size={size} onClick={() => change(next)} loading={pending}>
          {NEXT_LABEL[next] ?? STATUS_LABELS[next]}
        </Button>
      )}
      <Button size={size} variant="outline" onClick={() => change("CANCELLED")} disabled={pending}>
        {status === "PENDING" ? "Reject" : "Cancel"}
      </Button>
    </div>
  );
}
