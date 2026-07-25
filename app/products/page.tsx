export const dynamic = "force-dynamic";

import Link from "next/link";
import { getCategories, getProducts } from "../../lib/api";
import ProductCard from "../../components/ProductCard";

interface ProductsPageProps {
  searchParams: Promise<{ categoryId?: string; search?: string; page?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  const categoryId = params.categoryId;
  const search = params.search;
  const page = Math.max(1, Number(params.page) || 1);

  const [{ categories }, { products, pagination }] = await Promise.all([
    getCategories(),
    getProducts({ categoryId, search, page, limit: 12 }),
  ]);

  const currentCategory = categories.find((c) => c.id === categoryId);

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-zinc-900">
          {currentCategory ? currentCategory.name : "All Products"}
        </h1>

        <div className="mt-8 flex flex-col gap-6 lg:flex-row">
          <aside className="w-full lg:w-64">
            <h2 className="font-semibold text-zinc-900">Categories</h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/products"
                  className={`text-sm ${!categoryId ? "font-semibold text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}
                >
                  All Products
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <Link
                    href={`/products?categoryId=${category.id}`}
                    className={`text-sm ${categoryId === category.id ? "font-semibold text-zinc-900" : "text-zinc-600 hover:text-zinc-900"}`}
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex-1">
            {search && (
              <p className="mb-4 text-sm text-zinc-600">
                Showing results for <span className="font-semibold">{search}</span>
              </p>
            )}

            {products.length === 0 ? (
              <p className="text-zinc-600">No products found.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => {
                      const href = `/products?${new URLSearchParams({
                        ...(categoryId ? { categoryId } : {}),
                        ...(search ? { search } : {}),
                        page: p.toString(),
                      }).toString()}`;

                      return (
                        <Link
                          key={p}
                          href={href}
                          className={`flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium ${
                            p === page
                              ? "bg-zinc-900 text-white"
                              : "bg-white text-zinc-900 ring-1 ring-zinc-200 hover:bg-zinc-50"
                          }`}
                        >
                          {p}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
