import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata = { title: "Edit coupon" };

/** Date -> "YYYY-MM-DDTHH:mm" in IST for datetime-local inputs. */
function toLocalIST(date: Date | null): string {
  if (!date) return "";
  return new Date(date.getTime() + 330 * 60 * 1000).toISOString().slice(0, 16);
}

export default async function EditCouponPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <>
      <PageHeader title={`Edit ${coupon.code}`} back={{ href: "/admin/coupons", label: "Coupons" }} />
      <CouponForm
        id={coupon.id}
        initial={{
          code: coupon.code,
          description: coupon.description ?? "",
          type: coupon.type,
          value: coupon.value,
          maxDiscount: coupon.maxDiscount,
          minOrder: coupon.minOrder,
          startsAt: toLocalIST(coupon.startsAt),
          expiresAt: toLocalIST(coupon.expiresAt),
          usageLimit: coupon.usageLimit?.toString() ?? "",
          isActive: coupon.isActive,
        }}
      />
    </>
  );
}
