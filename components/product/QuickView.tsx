"use client";

import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useCart } from "../../lib/cart";
import {
  findVariant,
  initialChoice,
  sellableColours,
  sellableVariants,
  variantName,
} from "../../lib/variants";
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
import { VariantPicker } from "./VariantPicker";
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

  const cells = sellableVariants(product);
  const colours = sellableColours(product);
  const start = initialChoice(product);
  const [colourId, setColourId] = useState<string | null>(start.colourId);
  const [label, setLabel] = useState<string>(start.label);

  const chosen = findVariant(product, colourId, label);
  const colourName = colours.find((colour) => colour.id === chosen?.colourId)?.name ?? null;
  const chosenName = chosen ? variantName(colourName, chosen.label) : null;

  const soldOut = cells.length > 0 ? cells.every((cell) => cell.stock <= 0) : product.stock <= 0;
  // Incomplete until every axis this product actually has has been answered.
  const needsChoice = cells.length > 0 && (!chosen || (colours.length > 0 && !colourId));
  const available = chosen ? chosen.stock : cells.length > 0 ? 0 : product.stock;

  const handleAdd = () => {
    addToCart(
      product,
      quantity,
      chosen ? { id: chosen.id, label: chosen.label, colour: colourName } : null
    );
    onClose();
    openOverlay("cart");
    toast({
      tone: "cart",
      title: `Added ${quantity} to bag`,
      description: chosenName ? `${product.name} · ${chosenName}` : product.name,
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
            {!soldOut && !needsChoice && available <= 5 && (
              <Pill tone="peach">Only {available} left</Pill>
            )}
          </motion.div>

          <motion.h2 variants={fadeUp} className="text-3xl leading-tight text-balance">
            {product.name}
          </motion.h2>

          <motion.div variants={fadeUp} className="flex items-baseline gap-3">
            <span className="text-2xl font-bold tracking-tight text-ink">
              {formatPrice(chosen ? chosen.price : product.priceFrom)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-faint line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </motion.div>

          <motion.p variants={fadeUp} className="line-clamp-4 text-sm leading-relaxed text-muted">
            {product.description || "A little treat picked just for you."}
          </motion.p>

          {cells.length > 0 && (
            <motion.div variants={fadeUp}>
              <VariantPicker
                product={product}
                colourId={colourId}
                label={label}
                onColour={setColourId}
                onLabel={setLabel}
              />
            </motion.div>
          )}

          <motion.div variants={fadeUp} className="mt-auto flex flex-wrap items-center gap-3 pt-2">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              max={Math.max(1, Math.min(10, available))}
            />
            <Button onClick={handleAdd} disabled={soldOut || needsChoice} className="flex-1 min-w-40">
              <Sparkles className="h-4 w-4" strokeWidth={2.4} />
              {soldOut ? "Sold out" : needsChoice ? "Choose an option" : "Add to bag"}
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
