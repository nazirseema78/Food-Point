import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/server/actions/auth";
import { requireUserPage } from "@/server/auth-guard";
import { getUserOrders } from "@/server/queries/orders";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/order/status-badge";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

export default async function AccountPage() {
  const user = await requireUserPage("/account");
  const orders = await getUserOrders(user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">Hi, {user.name?.split(" ")[0]}</h1>
          <p className="text-sm text-stone-500">{user.email}</p>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" type="submit">
            <LogOut /> Log out
          </Button>
        </form>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your orders</h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-stone-700">No orders yet.</p>
            <Link href="/menu" className={buttonVariants({ className: "mt-4" })}>
              Browse menu
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/orders/${o.orderNumber}`} className="flex items-center gap-4 p-4 hover:bg-stone-50">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{o.orderNumber}</p>
                    <p className="truncate text-sm text-stone-500">
                      {o.items.map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                    </p>
                    <p className="text-xs text-stone-400">{formatDateTime(o.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(o.total)}</p>
                    <StatusBadge status={o.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
