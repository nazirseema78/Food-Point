"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveSettings } from "@/server/actions/admin/settings";
import { DAY_KEYS, DAY_LABELS, type OpeningHours } from "@/lib/hours";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, Input, PriceInput, Switch } from "@/components/ui/form-controls";
import { ImageUploader } from "./image-uploader";

export type SettingsValues = {
  name: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  logoUrl: string | null;
  acceptingOrders: boolean;
  deliveryEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryFee: number | null;
  freeDeliveryAbove: number | null;
  minOrder: number | null;
  taxPercent: string;
  openingHours: OpeningHours;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, start] = useTransition();
  const patch = (p: Partial<SettingsValues>) => setV((prev) => ({ ...prev, ...p }));

  function setDay(day: (typeof DAY_KEYS)[number], p: Partial<OpeningHours["mon"]>) {
    patch({ openingHours: { ...v.openingHours, [day]: { ...v.openingHours[day], ...p } } });
  }

  function copyMondayToAll() {
    patch({
      openingHours: Object.fromEntries(DAY_KEYS.map((d) => [d, { ...v.openingHours.mon }])) as OpeningHours,
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const res = await saveSettings({
        ...v,
        deliveryFee: v.deliveryFee ?? 0,
        minOrder: v.minOrder ?? 0,
        taxRateBps: Math.round((Number(v.taxPercent) || 0) * 100),
      });
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        toast.error(res.error);
        return;
      }
      toast.success("Settings saved");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="grid max-w-5xl gap-6 lg:grid-cols-2" noValidate>
      <Card>
        <CardHeader>
          <CardTitle>Shop details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Shop name" htmlFor="name" error={errors.name}>
            <Input id="name" value={v.name} onChange={(e) => patch({ name: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone" error={errors.phone}>
              <Input id="phone" type="tel" value={v.phone} onChange={(e) => patch({ phone: e.target.value })} />
            </Field>
            <Field label="Email (optional)" htmlFor="email" error={errors.email}>
              <Input id="email" type="email" value={v.email} onChange={(e) => patch({ email: e.target.value })} />
            </Field>
          </div>
          <Field label="Address" htmlFor="addressLine" error={errors.addressLine}>
            <Input id="addressLine" value={v.addressLine} onChange={(e) => patch({ addressLine: e.target.value })} />
          </Field>
          <Field label="City" htmlFor="city" error={errors.city}>
            <Input id="city" value={v.city} onChange={(e) => patch({ city: e.target.value })} />
          </Field>
          <div className="space-y-1.5">
            <span className="text-sm font-medium text-stone-700">Logo (optional)</span>
            <ImageUploader
              max={1}
              value={v.logoUrl ? [{ url: v.logoUrl }] : []}
              onChange={(imgs) => patch({ logoUrl: imgs[0]?.url ?? null })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ordering</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow label="Accepting orders" hint="Turn off to pause all online orders" checked={v.acceptingOrders} onChange={(acceptingOrders) => patch({ acceptingOrders })} />
          <ToggleRow label="Delivery" checked={v.deliveryEnabled} onChange={(deliveryEnabled) => patch({ deliveryEnabled })} />
          <ToggleRow label="Takeaway" checked={v.takeawayEnabled} onChange={(takeawayEnabled) => patch({ takeawayEnabled })} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery fee" htmlFor="deliveryFee" error={errors.deliveryFee}>
              <PriceInput id="deliveryFee" value={v.deliveryFee} onChange={(deliveryFee) => patch({ deliveryFee })} />
            </Field>
            <Field label="Free delivery above (optional)" htmlFor="freeDeliveryAbove" error={errors.freeDeliveryAbove}>
              <PriceInput id="freeDeliveryAbove" value={v.freeDeliveryAbove} onChange={(freeDeliveryAbove) => patch({ freeDeliveryAbove })} />
            </Field>
            <Field label="Minimum order" htmlFor="minOrder" error={errors.minOrder}>
              <PriceInput id="minOrder" value={v.minOrder} onChange={(minOrder) => patch({ minOrder })} />
            </Field>
            <Field label="Tax / GST %" htmlFor="taxPercent" hint="0 if prices include tax" error={errors.taxRateBps}>
              <Input
                id="taxPercent"
                inputMode="decimal"
                value={v.taxPercent}
                onChange={(e) => patch({ taxPercent: e.target.value.replace(/[^\d.]/g, "") })}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Opening hours</CardTitle>
          <Button type="button" variant="ghost" size="sm" onClick={copyMondayToAll}>
            Copy Monday to all days
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-stone-100">
            {DAY_KEYS.map((d) => {
              const day = v.openingHours[d];
              return (
                <div key={d} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-28 text-sm font-medium">{DAY_LABELS[d]}</span>
                  <Switch label={`Open on ${DAY_LABELS[d]}`} checked={!day.closed} onCheckedChange={(open) => setDay(d, { closed: !open })} />
                  {day.closed ? (
                    <span className="text-sm text-stone-500">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input
                        type="time"
                        aria-label={`${DAY_LABELS[d]} opening time`}
                        value={day.open}
                        onChange={(e) => setDay(d, { open: e.target.value })}
                        className="w-32"
                      />
                      <span className="text-stone-500">to</span>
                      <Input
                        type="time"
                        aria-label={`${DAY_LABELS[d]} closing time`}
                        value={day.close}
                        onChange={(e) => setDay(d, { close: e.target.value })}
                        className="w-32"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-stone-500">Closing after midnight is supported (e.g. 6:00 pm to 2:00 am). Times are in IST.</p>
        </CardContent>
      </Card>

      <div className="lg:col-span-2">
        <Button type="submit" size="lg" loading={pending}>
          Save settings
        </Button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-stone-800">{label}</p>
        {hint && <p className="text-xs text-stone-500">{hint}</p>}
      </div>
      <Switch label={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
