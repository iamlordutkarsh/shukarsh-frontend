export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory } from "../../../lib/api";
import ProductCard from "../../../components/ProductCard";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  let category;
  try {
    const data = await getCategory(slug);
    category = data.category;
  } catch {
    notFound();
  }

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-sm text-zinc-600">
          <Link href="/products" className="hover:text-zinc-900">
            Products
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">{category.name}</span>
        </div>

        <h1 className="text-3xl font-bold text-zinc-900">{category.name}</h1>
        {category.description && (
          <p className="mt-2 text-zinc-600">{category.description}</p>
        )}

        {category.products.length === 0 ? (
          <p className="mt-8 text-zinc-600">No products in this category yet.</p>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
