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
    <div className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            {currentCategory ? currentCategory.name : "All Products"}
          </h1>
          <p className="mt-2 text-[var(--text-muted)]">
            {currentCategory ? currentCategory.description : "Browse our full collection"}
          </p>
        </div>

        <div className="mt-10 flex flex-col gap-8 lg:flex-row">
          <aside className="w-full lg:w-64">
            <div className="rounded-xl bg-white p-5 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--foreground)]">Categories</h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link
                    href="/products"
                    className={`block rounded-md px-3 py-2 text-sm ${!categoryId ? "bg-[var(--muted)] font-semibold text-[var(--primary)]" : "text-[var(--text-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                  >
                    All Products
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/products?categoryId=${category.id}`}
                      className={`block rounded-md px-3 py-2 text-sm ${categoryId === category.id ? "bg-[var(--muted)] font-semibold text-[var(--primary)]" : "text-[var(--text-muted)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"}`}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="flex-1">
            {search && (
              <p className="mb-4 text-sm text-[var(--text-muted)]">
                Showing results for <span className="font-semibold text-[var(--foreground)]">{search}</span>
              </p>
            )}

            {products.length === 0 ? (
              <div className="rounded-xl bg-white p-10 text-center shadow-sm">
                <p className="text-[var(--text-muted)]">No products found.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {pagination.pages > 1 && (
                  <div className="mt-10 flex items-center justify-center gap-2">
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
                          className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium ${
                            p === page
                              ? "bg-[var(--foreground)] text-white"
                              : "bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--muted)]"
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
