import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { isWithinHours, parseOpeningHours } from "@/lib/hours";

// Single shop today; when branches arrive, this takes a slug/id.
export const getBranch = cache(async () => {
  const branch = await db.branch.findFirst({ orderBy: { createdAt: "asc" } });
  if (!branch) throw new Error("Shop settings not found. Run `npm run db:seed` first.");
  return branch;
});

export type Branch = Awaited<ReturnType<typeof getBranch>>;

export type ShopStatus = { isOpen: boolean; reason?: string };

export function getShopStatus(branch: Branch, now: Date = new Date()): ShopStatus {
  if (!branch.acceptingOrders)
    return { isOpen: false, reason: "We are not taking orders right now" };
  if (!branch.deliveryEnabled && !branch.takeawayEnabled)
    return { isOpen: false, reason: "Ordering is paused" };
  const hours = parseOpeningHours(branch.openingHours);
  if (!isWithinHours(hours, now, branch.timezone))
    return { isOpen: false, reason: "We are closed right now" };
  return { isOpen: true };
}
