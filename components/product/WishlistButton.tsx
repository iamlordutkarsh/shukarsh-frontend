"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Heart } from "lucide-react";
import { useState } from "react";
import { springBouncy } from "../../lib/motion";
import { cn } from "../../lib/utils";
import { useWishlist } from "../../lib/wishlist";
import type { Product } from "../../lib/types";
import { useToast } from "../ui/Toast";

const BURSTS = [0, 60, 120, 180, 240, 300];

export function WishlistButton({
  product,
  className,
  size = "md",
}: {
  product: Product;
  className?: string;
  size?: "sm" | "md";
}) {
  const { has, toggle } = useWishlist();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);
  const saved = has(product.id);

  const handleClick = () => {
    const nowSaved = toggle(product);
    if (nowSaved) setBurstKey((key) => key + 1);
    toast({
      tone: "wishlist",
      title: nowSaved ? "Saved to wishlist" : "Removed from wishlist",
      description: product.name,
      duration: 2600,
    });
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
      whileTap={reduced ? undefined : { scale: 0.85 }}
      transition={springBouncy}
      className={cn(
        "relative grid place-items-center rounded-full bg-surface/90 text-ink shadow-soft backdrop-blur transition-colors hover:text-blush-500",
        size === "sm" ? "h-9 w-9" : "h-10 w-10",
        saved && "text-blush-500",
        className
      )}
    >
      <motion.span
        key={`${saved}`}
        initial={reduced ? false : { scale: saved ? 0.4 : 1 }}
        animate={{ scale: 1 }}
        transition={springBouncy}
        className="grid place-items-center"
      >
        <Heart
          className={cn(size === "sm" ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]")}
          strokeWidth={2.4}
          fill={saved ? "currentColor" : "none"}
        />
      </motion.span>

      {!reduced && (
        <AnimatePresence>
          {burstKey > 0 && saved && (
            <span key={burstKey} aria-hidden className="pointer-events-none absolute inset-0">
              {BURSTS.map((angle) => (
                <motion.span
                  key={angle}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-blush-400"
                  initial={{ x: "-50%", y: "-50%", opacity: 1, scale: 1 }}
                  animate={{
                    x: `calc(-50% + ${Math.cos((angle * Math.PI) / 180) * 20}px)`,
                    y: `calc(-50% + ${Math.sin((angle * Math.PI) / 180) * 20}px)`,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{ duration: 0.55, ease: "easeOut" }}
                />
              ))}
            </span>
          )}
        </AnimatePresence>
      )}
    </motion.button>
  );
}
