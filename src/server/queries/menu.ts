import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const productInclude = {
  images: { orderBy: { sortOrder: "asc" } },
  variants: { orderBy: { sortOrder: "asc" } },
  addonGroups: {
    orderBy: { sortOrder: "asc" },
    include: { addons: { where: { isAvailable: true }, orderBy: { sortOrder: "asc" } } },
  },
} satisfies Prisma.ProductInclude;

export type MenuProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export async function getMenu(search?: string) {
  const q = search?.trim();
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      products: {
        where: {
          isActive: true,
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: productInclude,
      },
    },
  });
}

export async function getFeaturedProducts(limit = 8) {
  return db.product.findMany({
    where: { isActive: true, isFeatured: true, category: { isActive: true } },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    include: productInclude,
  });
}

export async function getActiveCategories() {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
}
