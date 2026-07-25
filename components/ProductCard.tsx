import Link from "next/link";
import { Product } from "../lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const image = product.images[0] || "https://placehold.co/400x400?text=No+Image";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div className="aspect-square overflow-hidden rounded-lg bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3">
        <p className="text-xs font-medium text-zinc-500">{product.category.name}</p>
        <h3 className="mt-1 text-sm font-semibold text-zinc-900 group-hover:text-zinc-700">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-zinc-900">₹{product.price.toFixed(2)}</span>
          {product.comparePrice && (
            <span className="text-xs text-zinc-500 line-through">
              ₹{product.comparePrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
