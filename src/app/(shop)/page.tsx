import Link from "next/link";
import { ArrowRight, Bike, ShoppingBag, Wallet } from "lucide-react";
import { getActiveCategories, getFeaturedProducts } from "@/server/queries/menu";
import { getBranch } from "@/server/queries/branch";
import { formatINR } from "@/lib/money";
import { buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/shop/product-card";
import { FoodImage } from "@/components/shop/food-image";

export default async function HomePage() {
  const [branch, categories, featured] = await Promise.all([
    getBranch(),
    getActiveCategories(),
    getFeaturedProducts(8),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-500 to-amber-500 text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:py-20">
          <p className="mb-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider">
            Hot · Fresh · Fast
          </p>
          <h1 className="max-w-xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            Cravings sorted. Burgers &amp; pizzas, made to order.
          </h1>
          <p className="mt-4 max-w-lg text-white/90">
            Order online from {branch.name} for delivery or takeaway. Pay cash when your food arrives.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/menu" className={buttonVariants({ size: "lg", variant: "secondary" })}>
              Order now <ArrowRight />
            </Link>
            <Link
              href="/track"
              className={buttonVariants({ size: "lg", variant: "outline", className: "border-white/40 bg-white/10 text-white hover:bg-white/20" })}
            >
              Track an order
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/90">
            {branch.deliveryEnabled && (
              <li className="flex items-center gap-2">
                <Bike className="size-4" aria-hidden />
                Delivery{branch.freeDeliveryAbove ? ` · free above ${formatINR(branch.freeDeliveryAbove)}` : ""}
              </li>
            )}
            {branch.takeawayEnabled && (
              <li className="flex items-center gap-2">
                <ShoppingBag className="size-4" aria-hidden /> Takeaway
              </li>
            )}
            <li className="flex items-center gap-2">
              <Wallet className="size-4" aria-hidden /> Cash on delivery
            </li>
          </ul>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-white/10" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 right-24 size-72 rounded-full bg-white/10" aria-hidden />
      </section>

      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10" aria-labelledby="cat-heading">
          <h2 id="cat-heading" className="mb-4 font-display text-2xl font-bold">
            What are you craving?
          </h2>
          <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/menu#${c.slug}`}
                className="group w-28 shrink-0 text-center sm:w-32"
              >
                <FoodImage
                  src={c.imageUrl}
                  alt={c.name}
                  sizes="128px"
                  className="aspect-square w-full rounded-2xl ring-1 ring-stone-200 transition group-hover:ring-brand-400"
                />
                <span className="mt-2 block text-sm font-semibold text-stone-800">{c.name}</span>
                <span className="block text-xs text-stone-500">{c._count.products} items</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-10" aria-labelledby="featured-heading">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="featured-heading" className="font-display text-2xl font-bold">
              Bestsellers
            </h2>
            <Link href="/menu" className="text-sm font-semibold text-brand-700 hover:underline">
              Full menu →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
