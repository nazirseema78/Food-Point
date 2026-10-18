import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone, Printer } from "lucide-react";
import { getOrderById } from "@/server/queries/orders";
import { STATUS_LABELS } from "@/lib/order-status";
import { formatDateTime } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/admin/page-header";
import { OrderLines } from "@/components/order/order-lines";
import { StatusBadge } from "@/components/order/status-badge";
import { StatusActions } from "@/components/admin/status-actions";
import { AutoRefresh } from "@/components/order/auto-refresh";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <>
      <AutoRefresh seconds={20} />
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`${formatDateTime(order.createdAt)} · ${order.type === "DELIVERY" ? "Delivery" : "Takeaway"} · Cash`}
        back={{ href: "/admin/orders", label: "Orders" }}
        actions={
          <Link href={`/admin/orders/${order.id}/print`} target="_blank" className={buttonVariants({ variant: "outline" })}>
            <Printer /> Print ticket
          </Link>
        }
      />

      <div className="grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
              <StatusBadge status={order.status} />
              <StatusActions orderId={order.id} type={order.type} status={order.status} size="default" />
            </CardHeader>
            <CardContent>
              <OrderLines items={order.items} totals={order} />
              {order.notes && (
                <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                  <strong>Customer note:</strong> {order.notes}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <a href={`tel:+91${order.customerPhone}`} className="flex items-center gap-2 text-brand-700 hover:underline">
                <Phone className="size-4" /> +91 {order.customerPhone}
              </a>
              {order.customerEmail && <p className="text-stone-600">{order.customerEmail}</p>}
              {order.type === "DELIVERY" && (
                <div className="border-t border-stone-100 pt-2 text-stone-700">
                  <p className="font-medium">Deliver to</p>
                  <p>{order.addressLine}</p>
                  {order.area && <p>{order.area}</p>}
                  {order.landmark && <p>Near {order.landmark}</p>}
                  <p>
                    {order.city} {order.pincode}
                  </p>
                </div>
              )}
              <p className="border-t border-stone-100 pt-2">
                Payment: Cash · <strong>{order.paymentStatus === "PAID" ? "Collected" : "To collect"}</strong>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                {order.events.map((e) => (
                  <li key={e.id} className="flex justify-between gap-3">
                    <span>
                      {STATUS_LABELS[e.status]}
                      {e.note && <span className="block text-xs text-stone-500">{e.note}</span>}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">{formatDateTime(e.createdAt)}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
