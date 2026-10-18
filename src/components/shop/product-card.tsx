"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { MenuProduct } from "@/server/queries/menu";
import { formatINR } from "@/lib/money";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Badge, VegMark } from "@/components/ui/badge";
import { FoodImage } from "./food-image";
import { ProductDialog } from "./product-dialog";

export function ProductCard({ product, priority }: { product: MenuProduct; priority?: boolean }) {
  const [open, setOpen] = useState(false);
  const add = useCart((s) => s.add);
  const hasOptions = product.variants.length > 0 || product.addonGroups.length > 0;
  const image = product.images[0]?.url ?? null;
  const soldOut = !product.isAvailable;

  function quickAdd() {
    if (hasOptions) return setOpen(true);
    add({
      productId: product.id,
      name: product.name,
      imageUrl: image,
      isVeg: product.isVeg,
      variantId: null,
      variantName: null,
      addonIds: [],
      addonNames: [],
      unitPrice: product.basePrice,
    });
    toast.success(`${product.name} added to cart`);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        aria-label={`View ${product.name}`}
      >
        <FoodImage
          src={image}
          alt={product.name}
          priority={priority}
          className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/60 text-sm font-semibold text-stone-800">
            Out of stock
          </span>
        )}
        {product.isFeatured && !soldOut && (
          <Badge variant="brand" className="absolute left-2 top-2 shadow-sm">
            Bestseller
          </Badge>
        )}
      </button>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <div className="flex items-start gap-2">
          <VegMark isVeg={product.isVeg} className="mt-0.5" />
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-stone-900 sm:text-base">
            {product.name}
          </h3>
        </div>
        {product.description && (
          <p className="line-clamp-2 text-xs text-stone-500 sm:text-sm">{product.description}</p>
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-2">
          <span className="text-sm font-bold text-stone-900 sm:text-base">
            {product.variants.length > 0 && <span className="text-xs font-normal text-stone-500">from </span>}
            {formatINR(product.basePrice)}
          </span>
          <Button size="sm" onClick={quickAdd} disabled={soldOut} aria-label={`Add ${product.name}`}>
            <Plus /> Add
          </Button>
        </div>
      </div>

      <ProductDialog product={product} open={open} onOpenChange={setOpen} />
    </article>
  );
}
