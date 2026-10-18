import { notFound } from "next/navigation";
import { getOrderById } from "@/server/queries/orders";
import { getBranch } from "@/server/queries/branch";
import { formatINR } from "@/lib/money";
import { formatDateTime } from "@/lib/utils";
import { addonNames } from "@/components/order/order-lines";
import { PrintOnLoad } from "@/components/admin/print-on-load";

export const metadata = { title: "Kitchen ticket" };

// Sized for 80mm thermal printers; also fine on A4.
export default async function PrintTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, branch] = await Promise.all([getOrderById(id), getBranch()]);
  if (!order) notFound();

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-white p-4">
      <PrintOnLoad />
      <div className="mx-auto w-[72mm] font-mono text-[12px] leading-snug text-black">
        <p className="text-center text-base font-bold">{branch.name}</p>
        <p className="text-center">+91 {branch.phone}</p>
        <hr className="my-2 border-dashed border-black" />
        <p className="text-center text-lg font-bold">{order.type === "DELIVERY" ? "DELIVERY" : "TAKEAWAY"}</p>
        <p className="text-center font-bold">#{order.orderNumber}</p>
        <p className="text-center">{formatDateTime(order.createdAt)}</p>
        <hr className="my-2 border-dashed border-black" />
        <table className="w-full">
          <tbody>
            {order.items.map((item) => {
              const extras = [item.variantName, ...addonNames(item.addons)].filter(Boolean);
              return (
                <tr key={item.id} className="align-top">
                  <td className="pr-1 font-bold">{item.quantity}×</td>
                  <td className="w-full">
                    {item.productName}
                    {extras.map((x) => (
                      <div key={x} className="pl-2">
                        + {x}
                      </div>
                    ))}
                  </td>
                  <td className="pl-1 text-right">{formatINR(item.lineTotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {order.notes && (
          <>
            <hr className="my-2 border-dashed border-black" />
            <p className="font-bold">NOTE: {order.notes}</p>
          </>
        )}
        <hr className="my-2 border-dashed border-black" />
        <Line label="Subtotal" value={formatINR(order.subtotal)} />
        {order.discount > 0 && <Line label={`Discount ${order.couponCode ?? ""}`} value={`-${formatINR(order.discount)}`} />}
        {order.deliveryFee > 0 && <Line label="Delivery" value={formatINR(order.deliveryFee)} />}
        {order.tax > 0 && <Line label="Tax" value={formatINR(order.tax)} />}
        <div className="flex justify-between text-sm font-bold">
          <span>TOTAL (CASH)</span>
          <span>{formatINR(order.total)}</span>
        </div>
        <hr className="my-2 border-dashed border-black" />
        <p className="font-bold">{order.customerName}</p>
        <p>+91 {order.customerPhone}</p>
        {order.type === "DELIVERY" && (
          <p>
            {[order.addressLine, order.area, order.landmark && `Near ${order.landmark}`, order.city, order.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
