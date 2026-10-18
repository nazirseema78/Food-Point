import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryActiveToggle } from "@/components/admin/catalog-toggles";
import { FoodImage } from "@/components/shop/food-image";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="Group your menu, e.g. Burgers, Pizzas, Drinks."
        actions={
          <Link href="/admin/categories/new" className={buttonVariants()}>
            <Plus /> New category
          </Link>
        }
      />
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
          No categories yet. Create your first one.
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-4 p-4">
              <FoodImage src={c.imageUrl} alt={c.name} sizes="56px" className="size-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="text-sm text-stone-500">
                  {c._count.products} product{c._count.products === 1 ? "" : "s"} · order {c.sortOrder}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <span className="hidden sm:inline">{c.isActive ? "Visible" : "Hidden"}</span>
                <CategoryActiveToggle id={c.id} value={c.isActive} />
              </div>
              <Link
                href={`/admin/categories/${c.id}`}
                className={buttonVariants({ variant: "outline", size: "icon-sm" })}
                aria-label={`Edit ${c.name}`}
              >
                <Pencil />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
