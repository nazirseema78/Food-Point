import Link from "next/link";
import { ClipboardList, IndianRupee, Plus, Timer } from "lucide-react";
import { getDashboardStats } from "@/server/queries/orders";
import { getBranch, getShopStatus } from "@/server/queries/branch";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/order/status-badge";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [stats, branch] = await Promise.all([getDashboardStats(), getBranch()]);
  const status = getShopStatus(branch);

  const tiles = [
    { label: "Orders today", value: String(stats.todayOrders), icon: ClipboardList },
    { label: "Revenue today", value: formatINR(stats.todayRevenue), icon: IndianRupee },
    { label: "In progress", value: String(stats.pending), icon: Timer, href: "/admin/orders" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={status.isOpen ? "Your shop is open and taking orders." : `${status.reason}.`}
        actions={
          <>
            <Link href="/admin/products/new" className={buttonVariants({ variant: "outline" })}>
              <Plus /> Add product
            </Link>
            <Link href="/admin/orders" className={buttonVariants()}>
              <ClipboardList /> Open orders board
            </Link>
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, href }) => {
          const body = (
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-stone-500">{label}</p>
                <Icon className="size-5 text-brand-600" aria-hidden />
              </div>
              <p className="mt-2 font-display text-3xl font-bold">{value}</p>
            </Card>
          );
          return href ? (
            <Link key={label} href={href} className="rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
              {body}
            </Link>
          ) : (
            <div key={label}>{body}</div>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recent.length === 0 ? (
            <p className="py-6 text-center text-sm text-stone-500">No orders yet. Share your website link to get started!</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {stats.recent.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/orders/${o.id}`} className="flex items-center gap-3 py-3 hover:bg-stone-50">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{o.orderNumber}</p>
                      <p className="text-xs text-stone-500">
                        {o.customerName} · {o.type === "DELIVERY" ? "Delivery" : "Takeaway"} · {formatDateTime(o.createdAt)}
                      </p>
                    </div>
                    <span className="font-semibold">{formatINR(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </>
  );
}
