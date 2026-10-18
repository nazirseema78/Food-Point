"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { setAcceptingOrders } from "@/server/actions/admin/settings";
import { Switch } from "@/components/ui/form-controls";

export function AcceptingToggle({ value }: { value: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [, start] = useTransition();
  return (
    <label className="flex items-center gap-2 text-sm text-stone-200">
      <Switch
        checked={optimistic}
        label="Accepting orders"
        onCheckedChange={(next) =>
          start(async () => {
            setOptimistic(next);
            const res = await setAcceptingOrders(next);
            if (!res.ok) toast.error(res.error);
            else toast.success(next ? "Shop is now taking orders" : "Ordering paused");
          })
        }
      />
      <span className="hidden sm:inline">{optimistic ? "Taking orders" : "Paused"}</span>
    </label>
  );
}
