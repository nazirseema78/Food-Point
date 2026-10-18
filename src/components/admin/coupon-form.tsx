"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCoupon } from "@/server/actions/admin/coupons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, PriceInput, Select, Switch } from "@/components/ui/form-controls";

export type CouponFormValues = {
  code: string;
  description: string;
  type: "FLAT" | "PERCENT";
  /** FLAT: paise. PERCENT: whole percent. */
  value: number | null;
  maxDiscount: number | null;
  minOrder: number | null;
  startsAt: string;
  expiresAt: string;
  usageLimit: string;
  isActive: boolean;
};

const EMPTY: CouponFormValues = {
  code: "",
  description: "",
  type: "FLAT",
  value: null,
  maxDiscount: null,
  minOrder: null,
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  isActive: true,
};

/** datetime-local value (IST wall time) -> ISO string. */
function localToIso(value: string): string | null {
  return value ? new Date(`${value}:00+05:30`).toISOString() : null;
}

export function CouponForm({ id, initial }: { id: string | null; initial?: CouponFormValues }) {
  const router = useRouter();
  const [v, setV] = useState<CouponFormValues>(initial ?? EMPTY);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const patch = (p: Partial<CouponFormValues>) => setV((prev) => ({ ...prev, ...p }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveCoupon(id, {
        code: v.code,
        description: v.description,
        type: v.type,
        value: v.value ?? 0,
        maxDiscount: v.type === "PERCENT" ? v.maxDiscount : null,
        minOrder: v.minOrder ?? 0,
        startsAt: localToIso(v.startsAt),
        expiresAt: localToIso(v.expiresAt),
        usageLimit: v.usageLimit ? Number(v.usageLimit) : null,
        isActive: v.isActive,
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success("Coupon saved");
      router.push("/admin/coupons");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6" noValidate>
      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2">
          <Field label="Code" htmlFor="code" error={errors.code} hint="Customers type this at checkout">
            <Input
              id="code"
              value={v.code}
              onChange={(e) => patch({ code: e.target.value.toUpperCase().replace(/\s/g, "") })}
              placeholder="WELCOME50"
              className="uppercase"
            />
          </Field>
          <Field label="Discount type" htmlFor="type">
            <Select
              id="type"
              value={v.type}
              onChange={(e) => patch({ type: e.target.value as "FLAT" | "PERCENT", value: null })}
            >
              <option value="FLAT">Flat amount (₹)</option>
              <option value="PERCENT">Percentage (%)</option>
            </Select>
          </Field>
          <Field label="Description (optional)" htmlFor="description" className="sm:col-span-2">
            <Input
              id="description"
              value={v.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="₹50 off on your first order"
            />
          </Field>

          {v.type === "FLAT" ? (
            <Field label="Discount amount" htmlFor="value" error={errors.value}>
              <PriceInput id="value" value={v.value} onChange={(value) => patch({ value })} />
            </Field>
          ) : (
            <>
              <Field label="Discount %" htmlFor="value" error={errors.value}>
                <Input
                  id="value"
                  type="number"
                  min={1}
                  max={100}
                  value={v.value ?? ""}
                  onChange={(e) => patch({ value: e.target.value ? Number(e.target.value) : null })}
                />
              </Field>
              <Field label="Max discount (optional)" htmlFor="maxDiscount" error={errors.maxDiscount}>
                <PriceInput id="maxDiscount" value={v.maxDiscount} onChange={(maxDiscount) => patch({ maxDiscount })} />
              </Field>
            </>
          )}

          <Field label="Minimum order (optional)" htmlFor="minOrder" error={errors.minOrder}>
            <PriceInput id="minOrder" value={v.minOrder} onChange={(minOrder) => patch({ minOrder })} />
          </Field>
          <Field label="Usage limit (optional)" htmlFor="usageLimit" hint="Total uses across all customers" error={errors.usageLimit}>
            <Input
              id="usageLimit"
              type="number"
              min={1}
              value={v.usageLimit}
              onChange={(e) => patch({ usageLimit: e.target.value })}
            />
          </Field>
          <Field label="Starts (optional)" htmlFor="startsAt" error={errors.startsAt}>
            <Input id="startsAt" type="datetime-local" value={v.startsAt} onChange={(e) => patch({ startsAt: e.target.value })} />
          </Field>
          <Field label="Expires (optional)" htmlFor="expiresAt" error={errors.expiresAt}>
            <Input id="expiresAt" type="datetime-local" value={v.expiresAt} onChange={(e) => patch({ expiresAt: e.target.value })} />
          </Field>
          <div className="flex items-center gap-3 sm:col-span-2">
            <Switch id="isActive" label="Active" checked={v.isActive} onCheckedChange={(isActive) => patch({ isActive })} />
            <label htmlFor="isActive" className="text-sm text-stone-700">
              Active
            </label>
          </div>
        </CardContent>
      </Card>
      <div className="flex gap-3">
        <Button type="submit" loading={pending}>
          Save coupon
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
