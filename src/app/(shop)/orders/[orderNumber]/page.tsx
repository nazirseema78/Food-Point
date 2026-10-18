import type { Metadata } from "next";
import Link from "next/link";
import { Check, CircleX, PartyPopper } from "lucide-react";
import { getOrderForViewer } from "@/server/queries/orders";
import { getBranch } from "@/server/queries/branch";
import { STATUS_LABELS, isFinal, statusFlow } from "@/lib/order-status";
import { cn, formatDateTime, formatTime } from "@/lib/utils";
import { OrderLines } from "@/components/order/order-lines";
import { StatusBadge } from "@/components/order/status-badge";
import { AutoRefresh } from "@/components/order/auto-refresh";
import { TrackForm } from "@/components/shop/track-form";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { orderNumber } = await params;
  const { placed } = await searchParams;
  const order = await getOrderForViewer(decodeURIComponent(orderNumber).toUpperCase());

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-12">
        <h1 className="mb-2 font-display text-2xl font-bold">Track your order</h1>
        <p className="mb-6 text-sm text-stone-600">Enter the mobile number used for this order to view it.</p>
        <TrackForm defaultOrderNumber={orderNumber} />
      </div>
    );
  }

  const branch = await getBranch();
  const flow = statusFlow(order.type);
  const reachedAt = new Map(order.events.map((e) => [e.status, e.createdAt]));
  const cancelled = order.status === "CANCELLED";
  const currentIdx = flow.indexOf(order.status);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <AutoRefresh enabled={!isFinal(order.status)} />

      {placed && (
        <div className="flex items-start gap-3 rounded-2xl bg-green-50 p-4 text-green-900">
          <PartyPopper className="mt-0.5 size-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">Order placed! Thank you.</p>
            <p className="text-sm">We&apos;ll confirm it shortly. This page updates automatically.</p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">Order {order.orderNumber}</h1>
          <p className="text-sm text-stone-500">
            {formatDateTime(order.createdAt)} · {order.type === "DELIVERY" ? "Delivery" : "Takeaway"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5" aria-label="Order progress">
        {cancelled ? (
          <p className="flex items-center gap-2 font-medium text-red-700">
            <CircleX className="size-5" /> This order was cancelled.
            {order.events.at(-1)?.note && <span className="font-normal">({order.events.at(-1)?.note})</span>}
          </p>
        ) : (
          <ol className="space-y-4">
            {flow.map((status, i) => {
              const done = i <= currentIdx;
              const at = reachedAt.get(status);
              return (
                <li key={status} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                      done ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300 bg-white text-transparent",
                      i === currentIdx && !isFinal(status) && "ring-4 ring-brand-100",
                    )}
                  >
                    <Check className="size-4" />
                  </span>
                  <span className={cn("flex-1 text-sm", done ? "font-semibold text-stone-900" : "text-stone-500")}>
                    {STATUS_LABELS[status]}
                  </span>
                  {at && <span className="text-xs text-stone-500">{formatTime(at)}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <h2 className="mb-3 font-semibold">Items</h2>
        <OrderLines items={order.items} totals={order} />
        <p className="mt-4 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
          Payment: Cash on {order.type === "DELIVERY" ? "delivery" : "pickup"} ·{" "}
          {order.paymentStatus === "PAID" ? "Paid" : "To be paid"}
        </p>
      </section>

      <section className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5 text-sm sm:grid-cols-2">
        <div>
          <h2 className="mb-1 font-semibold">{order.type === "DELIVERY" ? "Delivering to" : "Pickup from"}</h2>
          {order.type === "DELIVERY" ? (
            <p className="text-stone-600">
              {order.customerName}
              <br />
              {[order.addressLine, order.area, order.landmark].filter(Boolean).join(", ")}
              <br />
              {order.city} {order.pincode}
            </p>
          ) : (
            <p className="text-stone-600">
              {branch.name}
              <br />
              {branch.addressLine}, {branch.city}
            </p>
          )}
        </div>
        <div>
          <h2 className="mb-1 font-semibold">Need help?</h2>
          <p className="text-stone-600">
            Call us at{" "}
            <a href={`tel:+91${branch.phone}`} className="font-medium text-brand-700 hover:underline">
              +91 {branch.phone}
            </a>
          </p>
        </div>
      </section>

      <div className="text-center">
        <Link href="/menu" className="text-sm font-semibold text-brand-700 hover:underline">
          Order something else →
        </Link>
      </div>
    </div>
  );
}
