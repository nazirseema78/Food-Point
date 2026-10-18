"use client";

import { setCategoryActive, setProductFlag } from "@/server/actions/admin/catalog";
import { setCouponActive } from "@/server/actions/admin/coupons";
import { ToggleAction } from "./toggle-action";

// Server actions can't be passed as bound closures from server components, so
// each toggle lives here and receives only serialisable props.

export function CategoryActiveToggle({ id, value }: { id: string; value: boolean }) {
  return <ToggleAction value={value} label="Visible on menu" action={(v) => setCategoryActive(id, v)} />;
}

export function ProductFlagToggle({
  id,
  flag,
  value,
  label,
}: {
  id: string;
  flag: "isAvailable" | "isFeatured";
  value: boolean;
  label: string;
}) {
  return <ToggleAction value={value} label={label} action={(v) => setProductFlag(id, flag, v)} />;
}

export function CouponActiveToggle({ id, value }: { id: string; value: boolean }) {
  return <ToggleAction value={value} label="Coupon active" action={(v) => setCouponActive(id, v)} />;
}
