import "server-only";
import { db } from "@/lib/db";
import type { PricingLine } from "@/lib/pricing";
import type { CartItemInput } from "@/lib/validators/checkout";

/**
 * Turns client cart items (IDs only) into priced lines using current DB data.
 * Client-side prices are never used.
 */
export async function resolveCart(
  items: CartItemInput[],
): Promise<{ lines: PricingLine[]; errors: string[] }> {
  const ids = [...new Set(items.map((i) => i.productId))];
  const products = await db.product.findMany({
    where: { id: { in: ids } },
    include: {
      category: { select: { isActive: true } },
      variants: true,
      addonGroups: { include: { addons: true } },
    },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines: PricingLine[] = [];
  const errors: string[] = [];

  for (const item of items) {
    const product = byId.get(item.productId);
    if (!product || !product.isActive || !product.category.isActive) {
      errors.push("An item in your cart is no longer on the menu. Please remove it.");
      continue;
    }
    if (!product.isAvailable) {
      errors.push(`${product.name} is out of stock right now`);
      continue;
    }

    let basePrice = product.basePrice;
    let variantName: string | null = null;
    if (product.variants.length > 0) {
      const variant = product.variants.find((v) => v.id === item.variantId);
      if (!variant) {
        errors.push(`Please choose a size for ${product.name}`);
        continue;
      }
      basePrice = variant.price;
      variantName = variant.name;
    }

    const addonIds = new Set(item.addonIds ?? []);
    const allAddonIds = new Set(product.addonGroups.flatMap((g) => g.addons.map((a) => a.id)));
    if ([...addonIds].some((id) => !allAddonIds.has(id))) {
      errors.push(`Some options for ${product.name} have changed. Please add it again.`);
      continue;
    }

    const addons: PricingLine["addons"] = [];
    let addonProblem: string | null = null;
    for (const group of product.addonGroups) {
      const chosen = group.addons.filter((a) => addonIds.has(a.id));
      if (chosen.some((a) => !a.isAvailable)) {
        addonProblem = `An option for ${product.name} is unavailable`;
        break;
      }
      if (chosen.length < group.minSelect || chosen.length > group.maxSelect) {
        addonProblem = `Please review "${group.name}" for ${product.name}`;
        break;
      }
      addons.push(...chosen.map((a) => ({ name: a.name, price: a.price })));
    }
    if (addonProblem) {
      errors.push(addonProblem);
      continue;
    }

    lines.push({
      productId: product.id,
      productName: product.name,
      variantName,
      basePrice,
      addons,
      quantity: item.quantity,
    });
  }

  return { lines, errors };
}
