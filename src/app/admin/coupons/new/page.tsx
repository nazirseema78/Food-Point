import { PageHeader } from "@/components/admin/page-header";
import { CouponForm } from "@/components/admin/coupon-form";

export const metadata = { title: "New coupon" };

export default function NewCouponPage() {
  return (
    <>
      <PageHeader title="New coupon" back={{ href: "/admin/coupons", label: "Coupons" }} />
      <CouponForm id={null} />
    </>
  );
}
