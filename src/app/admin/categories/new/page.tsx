import { PageHeader } from "@/components/admin/page-header";
import { CategoryForm } from "@/components/admin/category-form";

export const metadata = { title: "New category" };

export default function NewCategoryPage() {
  return (
    <>
      <PageHeader title="New category" back={{ href: "/admin/categories", label: "Categories" }} />
      <CategoryForm id={null} />
    </>
  );
}
