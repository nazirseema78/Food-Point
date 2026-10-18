"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/utils";
import { settingsSchema } from "@/lib/validators/settings";
import { fieldErrors, firstError } from "@/lib/validators/common";
import { requireAdmin } from "@/server/auth-guard";
import { getBranch } from "@/server/queries/branch";

export async function saveSettings(input: unknown): Promise<ActionResult> {
  await requireAdmin();
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const branch = await getBranch();
  await db.branch.update({
    where: { id: branch.id },
    data: { ...parsed.data, freeDeliveryAbove: parsed.data.freeDeliveryAbove ?? null },
  });

  revalidatePath("/", "layout");
  return { ok: true, data: undefined, message: "Settings saved" };
}

/** Quick open/close switch from the admin header. */
export async function setAcceptingOrders(value: boolean): Promise<ActionResult> {
  await requireAdmin();
  const branch = await getBranch();
  await db.branch.update({ where: { id: branch.id }, data: { acceptingOrders: value } });
  revalidatePath("/", "layout");
  return { ok: true, data: undefined };
}
