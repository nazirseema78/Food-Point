"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { ActionResult } from "@/lib/utils";
import { categorySchema, productSchema } from "@/lib/validators/catalog";
import { fieldErrors, firstError } from "@/lib/validators/common";
import { requireAdmin } from "@/server/auth-guard";
import { uniqueSlug } from "@/server/slug";

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/menu");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
}

// ---------- Categories ----------

export async function saveCategory(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const data = parsed.data;
  const category = id
    ? await db.category.update({ where: { id }, data })
    : await db.category.create({
        data: {
          ...data,
          slug: await uniqueSlug(data.name, async (slug) =>
            !!(await db.category.findUnique({ where: { slug } })),
          ),
        },
      });

  revalidateCatalog();
  return { ok: true, data: { id: category.id }, message: "Category saved" };
}

export async function setCategoryActive(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  await db.category.update({ where: { id }, data: { isActive } });
  revalidateCatalog();
  return { ok: true, data: undefined };
}

// ---------- Products ----------

export async function saveProduct(
  id: string | null,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin();
  const parsed = productSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: firstError(parsed.error), fieldErrors: fieldErrors(parsed.error) };

  const { images, variants, addonGroups, ...fields } = parsed.data;

  const category = await db.category.findUnique({ where: { id: fields.categoryId } });
  if (!category) return { ok: false, error: "Category not found" };

  // With sizes, the listed "from" price is the cheapest size.
  const basePrice = variants.length > 0 ? Math.min(...variants.map((v) => v.price)) : fields.basePrice;

  const nested = {
    images: {
      create: images.map((img, i) => ({ url: img.url, publicId: img.publicId ?? null, sortOrder: i })),
    },
    variants: { create: variants.map((v, i) => ({ name: v.name, price: v.price, sortOrder: i })) },
    addonGroups: {
      create: addonGroups.map((g, gi) => ({
        name: g.name,
        minSelect: g.minSelect,
        maxSelect: Math.min(g.maxSelect, g.addons.length),
        sortOrder: gi,
        addons: {
          create: g.addons.map((a, ai) => ({
            name: a.name,
            price: a.price,
            isAvailable: a.isAvailable,
            sortOrder: ai,
          })),
        },
      })),
    },
  };

  let productId: string;
  if (id) {
    // Options are replaced wholesale; past orders keep their own snapshots.
    await db.$transaction(async (tx) => {
      await tx.productImage.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.addonGroup.deleteMany({ where: { productId: id } });
      await tx.product.update({ where: { id }, data: { ...fields, basePrice, ...nested } });
    });
    productId = id;
  } else {
    const slug = await uniqueSlug(fields.name, async (s) =>
      !!(await db.product.findUnique({ where: { slug: s } })),
    );
    const product = await db.product.create({ data: { ...fields, basePrice, slug, ...nested } });
    productId = product.id;
  }

  revalidateCatalog();
  return { ok: true, data: { id: productId }, message: "Product saved" };
}

export async function setProductFlag(
  id: string,
  flag: "isAvailable" | "isFeatured" | "isActive",
  value: boolean,
): Promise<ActionResult> {
  await requireAdmin();
  if (!["isAvailable", "isFeatured", "isActive"].includes(flag))
    return { ok: false, error: "Invalid field" };
  await db.product.update({ where: { id }, data: { [flag]: value } });
  revalidateCatalog();
  return { ok: true, data: undefined };
}
