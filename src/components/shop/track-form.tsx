"use client";

import { useActionState } from "react";
import { trackOrder } from "@/server/actions/checkout";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";

export function TrackForm({ defaultOrderNumber = "" }: { defaultOrderNumber?: string }) {
  const [state, action, pending] = useActionState(trackOrder, null);
  return (
    <form action={action} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5">
      <Field label="Order number" htmlFor="orderNumber" hint="Shown on your confirmation, e.g. FP261019-K7Q2">
        <Input id="orderNumber" name="orderNumber" defaultValue={defaultOrderNumber} required className="uppercase" />
      </Field>
      <Field label="Mobile number" htmlFor="phone">
        <Input id="phone" name="phone" type="tel" inputMode="numeric" autoComplete="tel-national" required />
      </Field>
      {state?.error && (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" loading={pending}>
        Track order
      </Button>
    </form>
  );
}
