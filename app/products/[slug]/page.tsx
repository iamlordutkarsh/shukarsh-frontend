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

  return (
    <div className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-sm text-zinc-600">
          <Link href="/products" className="hover:text-zinc-900">
            Products
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/categories/${product.category.slug}`} className="hover:text-zinc-900">
            {product.category.name}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-zinc-900">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-sm font-medium text-zinc-500">{product.category.name}</p>
            <h1 className="mt-2 text-3xl font-bold text-zinc-900">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <span className="text-2xl font-bold text-zinc-900">${product.price.toFixed(2)}</span>
              {product.comparePrice && (
                <span className="text-lg text-zinc-500 line-through">
                  ${product.comparePrice.toFixed(2)}
                </span>
              )}
            </div>
            <p className="mt-6 text-zinc-600">{product.description || "No description available."}</p>
            <div className="mt-8">
              <AddToCartButton product={product} />
            </div>
            <p className="mt-4 text-sm text-zinc-500">
              {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
            </p>
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-zinc-900">You may also like</h2>
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
