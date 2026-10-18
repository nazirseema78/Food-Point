import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "Edit category" };

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const category = await db.category.findUnique({ where: { id } });
  if (!category) notFound();

  return (
    <>
      <PageHeader title={`Edit ${category.name}`} back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm
        id={category.id}
        initial={{
          name: category.name,
          description: category.description ?? "",
          imageUrl: category.imageUrl,
          sortOrder: category.sortOrder,
          isActive: category.isActive,
        }}
      />
    </>
  );
}
