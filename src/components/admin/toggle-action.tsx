"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/utils";
import { Switch } from "@/components/ui/form-controls";

/** Inline switch that calls a server action, with optimistic UI. */
export function ToggleAction({
  value,
  label,
  action,
}: {
  value: boolean;
  label: string;
  action: (next: boolean) => Promise<ActionResult>;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [pending, start] = useTransition();
  return (
    <Switch
      checked={optimistic}
      label={label}
      disabled={pending}
      onCheckedChange={(next) =>
        start(async () => {
          setOptimistic(next);
          const res = await action(next);
          if (!res.ok) toast.error(res.error);
        })
      }
    />
  );
}
