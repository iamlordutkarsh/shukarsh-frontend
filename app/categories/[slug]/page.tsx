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
    <div className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Link href="/products" className="hover:text-[var(--primary)]">
            Products
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{category.name}</span>
        </nav>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-[var(--text-muted)]">{category.description}</p>
          )}
        </div>

        {category.products.length === 0 ? (
          <div className="mt-10 rounded-xl bg-white p-10 text-center shadow-sm">
            <p className="text-[var(--text-muted)]">No products in this category yet.</p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
