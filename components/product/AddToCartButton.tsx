"use client";

import { AnimatePresence, motion } from "motion/react";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCart } from "../../lib/cart";
import { springSnappy } from "../../lib/motion";
import type { Product } from "../../lib/types";
import { useUI } from "../../lib/ui-store";
import { sellableColours, sellableSizes, variantName } from "../../lib/variants";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";
import { QuantityStepper } from "./QuantityStepper";
import { VariantPicker } from "./VariantPicker";
import { useVariantChoice } from "./VariantChoice";
import { WishlistButton } from "./WishlistButton";

/** What the button says when the shopper has not finished choosing. */
function prompt(product: Product, colourId: string | null): string {
  const needsColour = sellableColours(product).length > 0 && !colourId;
  if (needsColour) return sellableSizes(product).length > 0 ? "Choose an option" : "Choose a colour";
  return "Choose a size";
}

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { open } = useUI();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const { colourId, label, setColour, setLabel, variant, incomplete, soldOut, available } =
    useVariantChoice();

  const colourName =
    (product.colours ?? []).find((colour) => colour.id === variant?.colourId)?.name ?? null;
  const chosenName = variant ? variantName(colourName, variant.label) : null;

  /** A cell with two left must not be entered with five still in the stepper. */
  const clampQuantity = (stock: number) =>
    setQuantity((current) => Math.max(1, Math.min(current, Math.max(1, stock))));

  const handleAdd = () => {
    addToCart(
      product,
      quantity,
      variant ? { id: variant.id, label: variant.label, colour: colourName } : null
    );
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1800);
    open("cart");
    toast({
      tone: "cart",
      title: quantity > 1 ? `Added ${quantity} to bag` : "Added to bag",
      description: chosenName ? `${product.name} · ${chosenName}` : product.name,
      duration: 2800,
    });
  };

  return (
    <div className="space-y-5">
      <VariantPicker
        product={product}
        colourId={colourId}
        label={label}
        onColour={(next) => {
          setColour(next);
          clampQuantity(available);
        }}
        onLabel={(next) => {
          setLabel(next);
          clampQuantity(available);
        }}
      />

      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          max={Math.max(1, Math.min(10, available))}
        />

        <Button
          onClick={handleAdd}
          disabled={soldOut || incomplete}
          size="lg"
          className="min-w-52 flex-1"
        >
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
                {soldOut ? "Sold out" : incomplete ? prompt(product, colourId) : "Add to bag"}
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
