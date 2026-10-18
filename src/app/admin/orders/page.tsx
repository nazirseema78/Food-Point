import { getBoardOrders } from "@/server/queries/orders";
import { PageHeader } from "@/components/admin/page-header";
import { OrdersBoard } from "@/components/admin/orders-board";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const orders = await getBoardOrders();
  return (
    <>
      <PageHeader title="Orders" description="Live board — refreshes every 10 seconds." />
      <OrdersBoard initial={orders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() }))} />
    </>
  );
}
