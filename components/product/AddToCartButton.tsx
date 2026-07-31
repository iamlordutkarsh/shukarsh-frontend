"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../lib/cart";
import { springSnappy } from "../../lib/motion";
import type { Product } from "../../lib/types";
import { useUI } from "../../lib/ui-store";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { QuantityStepper } from "./QuantityStepper";
import { SizePicker } from "./SizePicker";
import { WishlistButton } from "./WishlistButton";

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { open } = useUI();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const sizes = (product.variants ?? []).filter((variant) => variant.isActive);
  // One size is not a choice, so it is made for them.
  const [variantId, setVariantId] = useState<string | null>(sizes.length === 1 ? sizes[0].id : null);
  const chosen = sizes.find((size) => size.id === variantId) ?? null;

  const soldOut = sizes.length > 0 ? sizes.every((size) => size.stock <= 0) : product.stock <= 0;
  const needsSize = sizes.length > 0 && !chosen;
  const available = chosen ? chosen.stock : product.stock;

  const handleAdd = () => {
    addToCart(product, quantity, chosen ? { id: chosen.id, label: chosen.label } : null);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
    open("cart");
    toast({
      tone: "cart",
      title: quantity > 1 ? `Added ${quantity} to bag` : "Added to bag",
      description: chosen ? `${product.name} · ${chosen.label}` : product.name,
      duration: 2800,
    });
  };

  return (
    <div className="space-y-4">
      <SizePicker
        sizes={sizes}
        value={variantId}
        onChange={(next) => {
          setVariantId(next);
          // A size with two left must not be entered with a quantity of five
          // still sitting in the stepper from the size before it.
          const stock = sizes.find((size) => size.id === next)?.stock ?? 0;
          setQuantity((current) => Math.max(1, Math.min(current, stock)));
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        onChange={setQuantity}
        max={Math.max(1, Math.min(10, available))}
      />

      <Button onClick={handleAdd} disabled={soldOut || needsSize} size="lg" className="min-w-52 flex-1">
        <AnimatePresence mode="wait" initial={false}>
          {justAdded ? (
            <motion.span
              key="added"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.7 }}
              transition={springSnappy}
              className="flex items-center gap-2"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              Added to bag
            </motion.span>
          ) : (
            <motion.span
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={springSnappy}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.3} />
              {soldOut ? "Sold out" : needsSize ? "Choose a size" : "Add to bag"}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <WishlistButton product={product} className="h-14 w-14" />
      </div>
    </div>
  );
}

export default AddToCartButton;
