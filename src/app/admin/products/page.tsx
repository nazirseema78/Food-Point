import Link from "next/link";
import { Pencil, Plus, Search } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge, VegMark } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form-controls";
import { PageHeader } from "@/components/admin/page-header";
import { ProductFlagToggle } from "@/components/admin/catalog-toggles";
import { FoodImage } from "@/components/shop/food-image";

export const metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; view?: string }>;
}) {
  const { q, category, view } = await searchParams;
  const archived = view === "archived";

  const where: Prisma.ProductWhereInput = {
    isActive: !archived,
    ...(category ? { categoryId: category } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
  };

  const [products, categories] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
      include: {
        category: { select: { name: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
        _count: { select: { variants: true } },
      },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Products"
        description="Add items, change prices and mark items out of stock."
        actions={
          <Link href="/admin/products/new" className={buttonVariants()}>
            <Plus /> New product
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="flex flex-1 flex-wrap gap-2" action="/admin/products">
          {archived && <input type="hidden" name="view" value="archived" />}
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
            <Input name="q" defaultValue={q} placeholder="Search products" aria-label="Search products" className="pl-9" />
          </div>
          <Select name="category" defaultValue={category ?? ""} aria-label="Filter by category" className="w-auto">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Button type="submit" variant="outline">
            Filter
          </Button>
        </form>
        <div className="flex rounded-xl border border-stone-300 bg-white p-0.5 text-sm">
          <Link href="/admin/products" className={cn("rounded-lg px-3 py-1.5", !archived && "bg-stone-900 text-white")}>
            Active
          </Link>
          <Link
            href="/admin/products?view=archived"
            className={cn("rounded-lg px-3 py-1.5", archived && "bg-stone-900 text-white")}
          >
            Archived
          </Link>
        </div>
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
          {archived ? "No archived products." : q || category ? "No products match." : "No products yet. Add your first item!"}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="hidden border-b border-stone-200 bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500 md:table-header-group">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">In stock</th>
                <th className="px-4 py-3 font-medium">Bestseller</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.map((p) => (
                <tr key={p.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 md:table-row md:p-0">
                  <td className="flex w-full items-center gap-3 md:w-auto md:px-4 md:py-3">
                    <FoodImage src={p.images[0]?.url} alt={p.name} sizes="48px" className="size-12 shrink-0 rounded-lg" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold">
                        <VegMark isVeg={p.isVeg} /> {p.name}
                      </p>
                      <p className="text-xs text-stone-500">
                        {p.category.name}
                        {p._count.variants > 0 && ` · ${p._count.variants} sizes`}
                      </p>
                    </div>
                  </td>
                  <td className="font-medium md:px-4 md:py-3">
                    {p._count.variants > 0 && <span className="text-xs font-normal text-stone-500">from </span>}
                    {formatINR(p.basePrice)}
                  </td>
                  <td className="md:px-4 md:py-3">
                    <span className="flex items-center gap-2">
                      <ProductFlagToggle id={p.id} flag="isAvailable" value={p.isAvailable} label={`${p.name} in stock`} />
                      <span className="text-xs text-stone-500 md:hidden">In stock</span>
                    </span>
                  </td>
                  <td className="md:px-4 md:py-3">
                    <span className="flex items-center gap-2">
                      <ProductFlagToggle id={p.id} flag="isFeatured" value={p.isFeatured} label={`${p.name} bestseller`} />
                      <span className="text-xs text-stone-500 md:hidden">Bestseller</span>
                    </span>
                  </td>
                  <td className="ml-auto md:px-4 md:py-3 md:text-right">
                    {archived && <Badge className="mr-2">Archived</Badge>}
                    <Link
                      href={`/admin/products/${p.id}`}
                      className={buttonVariants({ variant: "outline", size: "sm" })}
                      aria-label={`Edit ${p.name}`}
                    >
                      <Pencil /> Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
