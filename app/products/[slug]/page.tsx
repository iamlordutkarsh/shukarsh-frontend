export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "../../../lib/api";
import AddToCartButton from "../../../components/AddToCartButton";
import ProductCard from "../../../components/ProductCard";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    const data = await getProduct(slug);
    product = data.product;
  } catch {
    notFound();
  }

  const { products: related } = await getProducts({
    categoryId: product.categoryId,
    limit: 4,
  });

  const relatedProducts = related.filter((p) => p.id !== product.id);
  const image = product.images[0] || "https://placehold.co/600x600?text=No+Image";
  const comparePrice = product.comparePrice;
  const hasDiscount = comparePrice && comparePrice > product.price;

  return (
    <div className="py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav className="mb-8 flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Link href="/products" className="hover:text-[var(--primary)]">
            Products
          </Link>
          <span>/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-[var(--primary)]">
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-[var(--foreground)]">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm">
            <div className="aspect-square overflow-hidden rounded-xl bg-[var(--muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-bold uppercase tracking-wider text-[var(--primary)]">
              {product.category.name}
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--foreground)] sm:text-4xl">
              {product.name}
            </h1>
            <div className="mt-5 flex items-center gap-3">
              <span className="text-3xl font-bold text-[var(--foreground)]">₹{product.price.toFixed(2)}</span>
              {comparePrice && (
                <span className="text-lg text-[var(--text-muted)] line-through">
                  ₹{comparePrice.toFixed(2)}
                </span>
              )}
              {hasDiscount && comparePrice && (
                <span className="rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-bold text-white">
                  {Math.round((1 - product.price / comparePrice) * 100)}% OFF
                </span>
              )}
            </div>
            <p className="mt-6 leading-relaxed text-[var(--text-muted)]">
              {product.description || "No description available."}
            </p>
            <div className="mt-8 flex items-center gap-4">
              <AddToCartButton product={product} />
            </div>
            <p className="mt-4 text-sm font-medium text-[var(--text-muted)]">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-20">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">You may also like</h2>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
