export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCategories, getProducts } from "../lib/api";
import CategoryCard from "../components/CategoryCard";
import ProductCard from "../components/ProductCard";

export default async function Home() {
  const { categories } = await getCategories();
  const { products } = await getProducts({ limit: 8 });

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-[var(--foreground)] py-24 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary-dark)]/30 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              New Collection Live
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Style your kitchen, wardrobe, and nails.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80">
              Shop kitchen essentials, trendy clothing, and beautiful artificial nails — all curated for you.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center rounded-lg bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[var(--primary-dark)]"
              >
                Shop Now
              </Link>
              <Link
                href="/categories/kitchen"
                className="inline-flex items-center rounded-lg bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/20"
              >
                Explore Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[var(--foreground)]">Shop by Category</h2>
            <p className="mt-2 text-[var(--text-muted)]">Browse our curated collections</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-[var(--foreground)]">Featured Products</h2>
              <p className="mt-1 text-[var(--text-muted)]">Handpicked just for you</p>
            </div>
            <Link
              href="/products"
              className="hidden rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:border-[var(--primary)] hover:text-[var(--primary)] sm:inline-block"
            >
              View all
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link
              href="/products"
              className="inline-block rounded-md border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:text-[var(--primary)]"
            >
              View all
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 rounded-2xl bg-[var(--muted)] p-8 sm:grid-cols-3 sm:p-10">
            {[
              { title: "Free Shipping", desc: "On orders over ₹999" },
              { title: "Secure Payments", desc: "Razorpay verified" },
              { title: "Quality Products", desc: "Handpicked selection" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <h3 className="text-lg font-bold text-[var(--foreground)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
