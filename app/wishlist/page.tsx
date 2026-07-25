"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { easeSoft } from "../../lib/motion";
import { useWishlist } from "../../lib/wishlist";
import { FloatingDecor } from "../../components/motion/FloatingDecor";
import { ProductCard } from "../../components/product/ProductCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { EmptyHeartArt } from "../../components/ui/KawaiiArt";
import { ProductGridSkeleton } from "../../components/ui/Skeleton";

export default function WishlistPage() {
  const { items, clear, ready, count } = useWishlist();

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[24rem] opacity-60" />

      <div className="section-shell relative">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-hero text-balance">Saved for later</h1>
            <p className="mt-2 text-sm text-muted">
              {count > 0
                ? `${count} ${count === 1 ? "piece" : "pieces"} kept on this device.`
                : "Tap the heart on anything you love."}
            </p>
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
              Clear all
            </Button>
          )}
        </header>

        <div className="mt-10">
          {!ready ? (
            <ProductGridSkeleton count={4} />
          ) : items.length === 0 ? (
            <EmptyState
              art={<EmptyHeartArt />}
              title="No favourites yet"
              description="Save the pieces you are thinking about and they will wait right here for you."
              action={
                <ButtonLink href="/products" size="lg">
                  Find something lovely
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              <AnimatePresence initial={false}>
                {items.map((product) => (
                  <motion.li
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.28, ease: easeSoft }}
                    className="h-full"
                  >
                    <ProductCard product={product} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
