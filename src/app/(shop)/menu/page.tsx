import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getMenu } from "@/server/queries/menu";
import { ProductCard } from "@/components/shop/product-card";
import { Input } from "@/components/ui/form-controls";

export const metadata: Metadata = {
  title: "Menu",
  description: "Burgers, pizzas, sides, drinks and desserts. Order online for delivery or takeaway.",
};

export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const categories = (await getMenu(q)).filter((c) => c.products.length > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold">Menu</h1>
        <form action="/menu" className="relative w-full sm:w-80" role="search">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" aria-hidden />
          <Input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Search burgers, pizzas…"
            aria-label="Search the menu"
            className="pl-9"
          />
        </form>
      </div>

      {categories.length > 0 && (
        <nav
          aria-label="Categories"
          className="scrollbar-none sticky top-16 z-30 -mx-4 mb-6 flex gap-2 overflow-x-auto border-b border-stone-200 bg-stone-50/95 px-4 py-3 backdrop-blur"
        >
          {categories.map((c) => (
            <a
              key={c.id}
              href={`#${c.slug}`}
              className="shrink-0 rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-medium text-stone-700 hover:border-brand-500 hover:text-brand-700"
            >
              {c.name}
            </a>
          ))}
        </nav>
      )}

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-10 text-center">
          <p className="font-semibold text-stone-800">
            {q ? `No items match “${q}”` : "The menu is being prepared. Check back soon!"}
          </p>
          {q && (
            <Link href="/menu" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline">
              Clear search
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {categories.map((c, ci) => (
            <section key={c.id} id={c.slug} className="scroll-mt-32" aria-labelledby={`h-${c.slug}`}>
              <h2 id={`h-${c.slug}`} className="mb-1 font-display text-2xl font-bold">
                {c.name}
              </h2>
              {c.description && <p className="mb-4 text-sm text-stone-500">{c.description}</p>}
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {c.products.map((p, pi) => (
                  <ProductCard key={p.id} product={p} priority={ci === 0 && pi < 4} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
