"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, ShoppingBag } from "lucide-react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { useState } from "react";
import { useCart } from "../../lib/cart";
import { springSoft } from "../../lib/motion";
import type { Product } from "../../lib/types";
import { useUI } from "../../lib/ui-store";
import { cn, discountPercent, formatPrice } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";
import { useToast } from "../ui/Toast";
import { QuickView } from "./QuickView";
import { WishlistButton } from "./WishlistButton";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
  className?: string;
}

export function ProductCard({ product, priority = false, className }: ProductCardProps) {
  const reduced = useReducedMotion();
  const { addToCart } = useCart();
  const { open } = useUI();
  const { toast } = useToast();
  const [quickView, setQuickView] = useState(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(useTransform(pointerY, [-0.5, 0.5], [7, -7]), springSoft);
  const rotateY = useSpring(useTransform(pointerX, [-0.5, 0.5], [-7, 7]), springSoft);

  const image = product.images[0];
  const discount = discountPercent(product.price, product.comparePrice);
  const soldOut = product.stock <= 0;

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (reduced) return;
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((event.clientY - rect.top) / rect.height - 0.5);
  };

  const resetTilt = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handleQuickAdd = () => {
    addToCart(product, 1);
    open("cart");
    toast({ tone: "cart", title: "Added to bag", description: product.name, duration: 2800 });
  };

  return (
    <>
      <div
        className={cn("perspective-card group relative", className)}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
      >
        <motion.article
          style={reduced ? undefined : { rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative flex h-full flex-col rounded-4xl bg-surface/85 p-3 shadow-soft transition-shadow duration-500 ease-[var(--ease-soft)] group-hover:shadow-glow"
        >
          {/* Full-card link sits under the interactive controls so markup stays valid. */}
          <Link
            href={`/products/${product.slug}`}
            className="absolute inset-0 z-10 rounded-4xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lavender-500"
          >
            <span className="sr-only">View {product.name}</span>
          </Link>

          <div className="relative aspect-4/5 overflow-hidden rounded-3xl bg-lavender-50">
            {image ? (
              <Image
                src={image}
                alt={product.name}
                fill
                priority={priority}
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 40vw, 46vw"
                className={cn(
                  "object-cover transition-transform duration-[900ms] ease-[var(--ease-soft)] group-hover:scale-[1.08]",
                  soldOut && "opacity-70 saturate-50"
                )}
              />
            ) : (
              <PastelTile
                seed={product.slug}
                className="transition-transform duration-[900ms] ease-[var(--ease-soft)] group-hover:scale-[1.08]"
              />
            )}

            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink-900/35 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />

            <div className="absolute left-3 top-3 z-20 flex flex-col items-start gap-1.5">
              {discount !== null && (
                <span className="rounded-full bg-gradient-to-r from-blush-400 to-peach-300 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-white shadow-soft">
                  {discount}% off
                </span>
              )}
              {soldOut && (
                <span className="rounded-full bg-ink-900/85 px-2.5 py-1 text-[0.6875rem] font-bold uppercase tracking-wider text-white">
                  Sold out
                </span>
              )}
            </div>

            <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
              <WishlistButton product={product} />
              <motion.button
                type="button"
                onClick={() => setQuickView(true)}
                aria-label={`Quick view ${product.name}`}
                whileTap={reduced ? undefined : { scale: 0.86 }}
                className="grid h-10 w-10 place-items-center rounded-full bg-surface/90 text-ink shadow-soft backdrop-blur transition-all duration-300 hover:text-lavender-600 sm:translate-x-2 sm:opacity-0 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100"
              >
                <Eye className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
              </motion.button>
            </div>

            {!soldOut && (
              <motion.button
                type="button"
                onClick={handleQuickAdd}
                whileTap={reduced ? undefined : { scale: 0.96 }}
                className="absolute inset-x-3 bottom-3 z-20 flex h-11 items-center justify-center gap-2 rounded-full bg-ink-900/90 text-[0.8125rem] font-semibold text-white shadow-lift backdrop-blur transition-all duration-500 ease-[var(--ease-soft)] hover:bg-lavender-600 sm:translate-y-[130%] sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
              >
                <ShoppingBag className="h-4 w-4" strokeWidth={2.3} />
                Add to bag
              </motion.button>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-1.5 px-2 pb-1 pt-4">
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-lavender-500">
              {product.category.name}
            </span>
            <h3 className="font-display text-[1.0625rem] leading-snug text-ink transition-colors duration-300 group-hover:text-lavender-700">
              <span className="line-clamp-2">{product.name}</span>
            </h3>
            <div className="mt-auto flex items-baseline gap-2 pt-1.5">
              <span className="text-lg font-bold tracking-tight text-ink">{formatPrice(product.price)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <span className="text-xs text-faint line-through">{formatPrice(product.comparePrice)}</span>
              )}
            </div>
          </div>
        </motion.article>
      </div>

      <QuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
}

export default ProductCard;
