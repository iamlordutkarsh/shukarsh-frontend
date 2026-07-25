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
import { WishlistButton } from "./WishlistButton";

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { open } = useUI();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const soldOut = product.stock <= 0;

  const handleAdd = () => {
    addToCart(product, quantity);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
    open("cart");
    toast({
      tone: "cart",
      title: quantity > 1 ? `Added ${quantity} to bag` : "Added to bag",
      description: product.name,
      duration: 2800,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={quantity}
        onChange={setQuantity}
        max={Math.max(1, Math.min(10, product.stock))}
      />

      <Button onClick={handleAdd} disabled={soldOut} size="lg" className="min-w-52 flex-1">
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
              {soldOut ? "Sold out" : "Add to bag"}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>

      <WishlistButton product={product} className="h-14 w-14" />
    </div>
  );
}

export default AddToCartButton;
