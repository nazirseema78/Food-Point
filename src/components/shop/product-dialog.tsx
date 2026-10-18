"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import type { MenuProduct } from "@/server/queries/menu";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VegMark } from "@/components/ui/badge";
import { FoodImage } from "./food-image";

export function ProductDialog({
  product,
  open,
  onOpenChange,
}: {
  product: MenuProduct;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={product.name} description={product.description ?? undefined}>
        {/* Remount on open so choices reset each time. */}
        {open && <ProductOptions product={product} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductOptions({ product, onDone }: { product: MenuProduct; onDone: () => void }) {
  const add = useCart((s) => s.add);
  const [variantId, setVariantId] = useState<string | null>(product.variants[0]?.id ?? null);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [showErrors, setShowErrors] = useState(false);

  const variant = product.variants.find((v) => v.id === variantId) ?? null;
  const base = variant ? variant.price : product.basePrice;

  const chosenAddons = useMemo(
    () =>
      product.addonGroups.flatMap((g) =>
        g.addons.filter((a) => (selected[g.id] ?? []).includes(a.id)),
      ),
    [product.addonGroups, selected],
  );
  const unitPrice = base + chosenAddons.reduce((s, a) => s + a.price, 0);

  const groupErrors = product.addonGroups
    .filter((g) => (selected[g.id]?.length ?? 0) < g.minSelect)
    .map((g) => g.id);

  function toggle(groupId: string, addonId: string, max: number) {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      if (max === 1) return { ...prev, [groupId]: current[0] === addonId ? [] : [addonId] };
      if (current.includes(addonId)) return { ...prev, [groupId]: current.filter((id) => id !== addonId) };
      if (current.length >= max) {
        toast.message(`You can choose up to ${max}`);
        return prev;
      }
      return { ...prev, [groupId]: [...current, addonId] };
    });
  }

  function addToCart() {
    if (groupErrors.length > 0 || (product.variants.length > 0 && !variant)) {
      setShowErrors(true);
      return;
    }
    add(
      {
        productId: product.id,
        name: product.name,
        imageUrl: product.images[0]?.url ?? null,
        isVeg: product.isVeg,
        variantId: variant?.id ?? null,
        variantName: variant?.name ?? null,
        addonIds: chosenAddons.map((a) => a.id),
        addonNames: chosenAddons.map((a) => a.name),
        unitPrice,
      },
      quantity,
    );
    toast.success(`${product.name} added to cart`);
    onDone();
  }

  return (
    <>
      <div className="overflow-y-auto">
        <FoodImage
          src={product.images[0]?.url}
          alt={product.name}
          sizes="(max-width: 640px) 100vw, 512px"
          className="aspect-[16/10] w-full"
        />
        <div className="space-y-5 p-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <VegMark isVeg={product.isVeg} />
              <h2 className="font-display text-xl font-bold text-stone-900">{product.name}</h2>
            </div>
            {product.description && <p className="text-sm text-stone-600">{product.description}</p>}
          </div>

          {product.variants.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-semibold text-stone-900">Choose size</legend>
              {product.variants.map((v) => (
                <OptionRow
                  key={v.id}
                  type="radio"
                  name="variant"
                  checked={variantId === v.id}
                  onChange={() => setVariantId(v.id)}
                  label={v.name}
                  price={formatINR(v.price)}
                />
              ))}
            </fieldset>
          )}

          {product.addonGroups.map((g) =>
            g.addons.length === 0 ? null : (
              <fieldset key={g.id} className="space-y-2">
                <legend className="mb-2 flex w-full items-baseline justify-between gap-2 text-sm font-semibold text-stone-900">
                  <span>{g.name}</span>
                  <span
                    className={cn(
                      "text-xs font-normal",
                      showErrors && groupErrors.includes(g.id) ? "text-red-600" : "text-stone-500",
                    )}
                  >
                    {g.minSelect > 0 ? `Required · choose ${g.minSelect === g.maxSelect ? g.minSelect : `${g.minSelect}–${g.maxSelect}`}` : `Optional · up to ${g.maxSelect}`}
                  </span>
                </legend>
                {g.addons.map((a) => (
                  <OptionRow
                    key={a.id}
                    type={g.maxSelect === 1 ? "radio" : "checkbox"}
                    name={g.id}
                    checked={(selected[g.id] ?? []).includes(a.id)}
                    onChange={() => toggle(g.id, a.id, g.maxSelect)}
                    label={a.name}
                    price={a.price > 0 ? `+ ${formatINR(a.price)}` : "Free"}
                  />
                ))}
              </fieldset>
            ),
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-stone-200 bg-white p-4">
        <div className="flex items-center rounded-xl border border-stone-300">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Decrease quantity"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus />
          </Button>
          <span className="w-8 text-center font-semibold" aria-live="polite">
            {quantity}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Increase quantity"
            onClick={() => setQuantity((q) => Math.min(50, q + 1))}
          >
            <Plus />
          </Button>
        </div>
        <Button size="lg" className="flex-1" onClick={addToCart} disabled={!product.isAvailable}>
          {product.isAvailable ? `Add · ${formatINR(unitPrice * quantity)}` : "Out of stock"}
        </Button>
      </div>
    </>
  );
}

function OptionRow({
  type,
  name,
  checked,
  onChange,
  label,
  price,
}: {
  type: "radio" | "checkbox";
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  price: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors",
        checked ? "border-brand-500 bg-brand-50" : "border-stone-200 hover:bg-stone-50",
      )}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        onChange={onChange}
        onClick={type === "radio" && checked ? onChange : undefined}
        className="size-4 accent-brand-600"
      />
      <span className="flex-1 text-stone-800">{label}</span>
      <span className="text-stone-600">{price}</span>
    </label>
  );
}
