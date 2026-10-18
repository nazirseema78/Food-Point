import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { sortOrder: "asc" } },
        addonGroups: { orderBy: { sortOrder: "asc" }, include: { addons: { orderBy: { sortOrder: "asc" } } } },
      },
    }),
    db.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
  ]);
  if (!product) notFound();

  return (
    <>
      <PageHeader title={`Edit ${product.name}`} back={{ href: "/admin/products", label: "Products" }} />
      <ProductForm
        id={product.id}
        isActive={product.isActive}
        categories={categories}
        initial={{
          name: product.name,
          description: product.description ?? "",
          categoryId: product.categoryId,
          basePrice: product.basePrice,
          isVeg: product.isVeg,
          isAvailable: product.isAvailable,
          isFeatured: product.isFeatured,
          sortOrder: product.sortOrder,
          images: product.images.map((i) => ({ url: i.url, publicId: i.publicId })),
          variants: product.variants.map((v) => ({ name: v.name, price: v.price })),
          addonGroups: product.addonGroups.map((g) => ({
            name: g.name,
            minSelect: g.minSelect,
            maxSelect: g.maxSelect,
            addons: g.addons.map((a) => ({ name: a.name, price: a.price, isAvailable: a.isAvailable })),
          })),
        }}
      />
    </>
  );
}
