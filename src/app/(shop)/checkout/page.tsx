import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getBranch, getShopStatus } from "@/server/queries/branch";
import { currentUser } from "@/server/auth-guard";
import { CheckoutForm } from "@/components/shop/checkout-form";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const [branch, sessionUser] = await Promise.all([getBranch(), currentUser()]);
  const status = getShopStatus(branch);

  // Prefill from the account and the last delivery order.
  const [user, lastOrder] = sessionUser
    ? await Promise.all([
        db.user.findUnique({ where: { id: sessionUser.id }, select: { name: true, email: true, phone: true } }),
        db.order.findFirst({
          where: { userId: sessionUser.id, type: "DELIVERY" },
          orderBy: { createdAt: "desc" },
          select: { addressLine: true, area: true, city: true, pincode: true, landmark: true, customerPhone: true },
        }),
      ])
    : [null, null];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 font-display text-3xl font-bold">Checkout</h1>
      <CheckoutForm
        shop={{
          isOpen: status.isOpen,
          closedReason: status.reason ?? null,
          deliveryEnabled: branch.deliveryEnabled,
          takeawayEnabled: branch.takeawayEnabled,
          addressLine: branch.addressLine,
          city: branch.city,
        }}
        defaults={{
          customerName: user?.name ?? "",
          customerEmail: user?.email ?? "",
          customerPhone: user?.phone ?? lastOrder?.customerPhone ?? "",
          addressLine: lastOrder?.addressLine ?? "",
          area: lastOrder?.area ?? "",
          city: lastOrder?.city ?? branch.city,
          pincode: lastOrder?.pincode ?? "",
          landmark: lastOrder?.landmark ?? "",
        }}
        isLoggedIn={!!sessionUser}
      />
    </div>
  );
}
