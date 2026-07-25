import Link from "next/link";
import { Product } from "../lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] || "https://placehold.co/400x400?text=No+Image";
  const comparePrice = product.comparePrice;
  const hasDiscount = comparePrice && comparePrice > product.price;

  return (
    <Link href={`/products/${product.slug}`} className="group block rounded-xl bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--muted)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {hasDiscount && comparePrice && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-1 text-xs font-bold text-white">
            {Math.round((1 - product.price / comparePrice) * 100)}% OFF
          </span>
        )}
      </div>
      <div className="mt-3 px-1">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--primary)]">{product.category.name}</p>
        <h3 className="mt-1 text-sm font-semibold text-[var(--foreground)] line-clamp-1 group-hover:text-[var(--primary)]">
          {product.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-base font-bold text-[var(--foreground)]">₹{product.price.toFixed(2)}</span>
          {product.comparePrice && (
            <span className="text-xs text-[var(--text-muted)] line-through">
              ₹{product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
