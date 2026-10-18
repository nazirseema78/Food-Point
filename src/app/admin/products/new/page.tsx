import Link from "next/link";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await db.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true },
  });

  return (
    <>
      <PageHeader title="New product" back={{ href: "/admin/products", label: "Products" }} />
      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center text-stone-600">
          First{" "}
          <Link href="/admin/categories/new" className="font-semibold text-brand-700 hover:underline">
            create a category
          </Link>{" "}
          (e.g. Burgers), then add products to it.
        </p>
      ) : (
        <ProductForm id={null} categories={categories} />
      )}
    </>
  );
}
