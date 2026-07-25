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
      <section className="bg-zinc-900 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to Shukarsh
          </h1>
          <p className="mt-4 max-w-xl text-lg text-zinc-300">
            Shop kitchen essentials, trendy clothing, and beautiful artificial nails all in one place.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-block rounded-md bg-white px-6 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-100"
          >
            Shop Now
          </Link>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-zinc-900">Shop by Category</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-zinc-900">Featured Products</h2>
            <Link href="/products" className="text-sm font-semibold text-zinc-900 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
