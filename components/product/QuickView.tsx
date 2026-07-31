"use client";

import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useCart } from "../../lib/cart";
import { staggerParent, fadeUp } from "../../lib/motion";
import type { Product } from "../../lib/types";
import { useUI } from "../../lib/ui-store";
import { discountPercent, formatPrice } from "../../lib/utils";
import { Button, ButtonLink } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { PastelTile } from "../ui/PastelTile";
import { Pill } from "../ui/Pill";
import { useToast } from "../ui/Toast";
import { QuantityStepper } from "./QuantityStepper";
import { SizePicker } from "./SizePicker";
import { WishlistButton } from "./WishlistButton";

export function QuickView({
  product,
  open,
  onClose,
}: {
  product: Product;
  open: boolean;
  onClose: () => void;
}) {
  const { addToCart } = useCart();
  const { open: openOverlay } = useUI();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const discount = discountPercent(product.price, product.comparePrice);

  const sizes = (product.variants ?? []).filter((variant) => variant.isActive);
  const [variantId, setVariantId] = useState<string | null>(sizes.length === 1 ? sizes[0].id : null);
  const chosen = sizes.find((size) => size.id === variantId) ?? null;

  const soldOut = sizes.length > 0 ? sizes.every((size) => size.stock <= 0) : product.stock <= 0;
  const needsSize = sizes.length > 0 && !chosen;
  const available = chosen ? chosen.stock : product.stock;

  const handleAdd = () => {
    addToCart(product, quantity, chosen ? { id: chosen.id, label: chosen.label } : null);
    onClose();
    openOverlay("cart");
    toast({
      tone: "cart",
      title: `Added ${quantity} to bag`,
      description: chosen ? `${product.name} · ${chosen.label}` : product.name,
      duration: 2800,
    });
  };

  return (
    <Modal open={open} onClose={onClose} label={`Quick view: ${product.name}`}>
      <div className="grid gap-0 sm:grid-cols-2">
        <div className="relative aspect-4/5 bg-lavender-50 sm:aspect-auto sm:min-h-[30rem]">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 34vw, 100vw"
              className="object-cover"
            />
          ) : (
            <PastelTile seed={product.slug} />
          )}
          {discount !== null && (
            <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-blush-400 to-peach-300 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-soft">
              {discount}% off
            </span>
          )}
        </div>

        <motion.div
          variants={staggerParent(0.07, 0.08)}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-4 p-7 sm:p-9"
        >
          <motion.div variants={fadeUp} className="flex items-center gap-2">
            <Pill tone="lavender">{product.category.name}</Pill>
            {!soldOut && !needsSize && available <= 5 && (
              <Pill tone="peach">Only {available} left</Pill>
            )}
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-3xl leading-tight text-balance">
            {product.name}
          </motion.h2>

          <motion.div variants={fadeUp} className="flex items-baseline gap-3">
            <span className="text-2xl font-bold tracking-tight text-ink">{formatPrice(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-faint line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </motion.div>

          <motion.p variants={fadeUp} className="line-clamp-4 text-sm leading-relaxed text-muted">
            {product.description || "A little treat picked just for you."}
          </motion.p>

          {sizes.length > 0 && (
            <motion.div variants={fadeUp}>
              <SizePicker
                sizes={sizes}
                value={variantId}
                onChange={(next) => {
                  setVariantId(next);
                  const stock = sizes.find((s) => s.id === next)?.stock ?? 0;
                  setQuantity((current) => Math.max(1, Math.min(current, stock)));
                }}
              />
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(1, Math.min(10, available))}
            />
            <Button onClick={handleAdd} disabled={soldOut || needsSize} className="flex-1 min-w-40">
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              {soldOut ? "Sold out" : needsSize ? "Choose a size" : "Add to bag"}
            </Button>
            <WishlistButton product={product} />
          </motion.div>

          <motion.div variants={fadeUp}>
            <ButtonLink href={`/products/${product.slug}`} variant="ghost" size="sm" onClick={onClose}>
              See full details
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
            </ButtonLink>
          </motion.div>
        </motion.div>
      </div>
    </Modal>
  );
}
