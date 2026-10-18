import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

type Line = {
  id: string;
  productName: string;
  variantName: string | null;
  addons: unknown;
  quantity: number;
  lineTotal: number;
};

type Totals = { subtotal: number; discount: number; deliveryFee: number; tax: number; total: number; couponCode: string | null };

export function addonNames(addons: unknown): string[] {
  return Array.isArray(addons)
    ? addons.map((a) => (a && typeof a === "object" && "name" in a ? String(a.name) : "")).filter(Boolean)
    : [];
}

export function OrderLines({ items, totals }: { items: Line[]; totals: Totals }) {
  return (
    <div className="space-y-3 text-sm">
      <ul className="space-y-2">
        {items.map((item) => {
          const extras = [item.variantName, ...addonNames(item.addons)].filter(Boolean);
          return (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                <span className="font-medium">{item.quantity} ×</span> {item.productName}
                {extras.length > 0 && <span className="block text-xs text-stone-500">{extras.join(" · ")}</span>}
              </span>
              <span className="shrink-0 font-medium">{formatINR(item.lineTotal)}</span>
            </li>
          );
        })}
      </ul>
      <dl className="space-y-1 border-t border-stone-100 pt-3">
        <TotalRow label="Subtotal" value={formatINR(totals.subtotal)} />
        {totals.discount > 0 && (
          <TotalRow
            label={`Discount${totals.couponCode ? ` (${totals.couponCode})` : ""}`}
            value={`− ${formatINR(totals.discount)}`}
            className="text-green-700"
          />
        )}
        {totals.deliveryFee > 0 && <TotalRow label="Delivery fee" value={formatINR(totals.deliveryFee)} />}
        {totals.tax > 0 && <TotalRow label="Taxes" value={formatINR(totals.tax)} />}
        <TotalRow label="Total" value={formatINR(totals.total)} className="pt-1 text-base font-bold" />
      </dl>
    </div>
  );
}

function TotalRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <dt className="text-stone-600">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
