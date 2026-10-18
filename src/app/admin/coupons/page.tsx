import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/admin/page-header";
import { CouponActiveToggle } from "@/components/admin/catalog-toggles";

export const metadata = { title: "Coupons" };

export default async function CouponsPage() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  const now = new Date();

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Discount codes customers can apply at checkout."
        actions={
          <Link href="/admin/coupons/new" className={buttonVariants()}>
            <Plus /> New coupon
          </Link>
        }
      />
      {coupons.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
          No coupons yet.
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {coupons.map((c) => {
            const expired = c.expiresAt && c.expiresAt < now;
            const exhausted = c.usageLimit != null && c.usedCount >= c.usageLimit;
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-stone-900 px-2 py-0.5 font-mono text-sm font-bold text-white">{c.code}</span>
                    <span className="font-semibold">
                      {c.type === "FLAT" ? `${formatINR(c.value)} off` : `${c.value}% off`}
                      {c.type === "PERCENT" && c.maxDiscount != null && ` (max ${formatINR(c.maxDiscount)})`}
                    </span>
                    {expired && <Badge variant="danger">Expired</Badge>}
                    {exhausted && <Badge variant="warning">Limit reached</Badge>}
                  </p>
                  <p className="mt-1 text-sm text-stone-500">
                    {c.minOrder > 0 ? `Min order ${formatINR(c.minOrder)} · ` : ""}
                    Used {c.usedCount}
                    {c.usageLimit != null ? `/${c.usageLimit}` : ""} times
                    {c.expiresAt ? ` · expires ${formatDateTime(c.expiresAt)}` : ""}
                  </p>
                </div>
                <CouponActiveToggle id={c.id} value={c.isActive} />
                <Link
                  href={`/admin/coupons/${c.id}`}
                  className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                  aria-label={`Edit ${c.code}`}
                >
                  <Pencil />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
