"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Product, ProductVariant } from "../../lib/types";
import { findVariant, imagesForColour, initialChoice, sellableColours, sellableVariants } from "../../lib/variants";

interface VariantChoiceValue {
  colourId: string | null;
  label: string;
  setColour: (colourId: string) => void;
  setLabel: (label: string) => void;
  /** The cell both choices land on, once they are enough to name one. */
  variant: ProductVariant | null;
  /** True while the shopper still has a choice left to make. */
  incomplete: boolean;
  /** Nothing left anywhere on this product. */
  soldOut: boolean;
  /** How many of the chosen cell there are, or of the product when it has none. */
  available: number;
  /** What the chosen cell costs, falling back to the product's own price. */
  price: number;
  /** The photos for the chosen colour, or the product's. */
  images: string[];
}

const VariantChoiceContext = createContext<VariantChoiceValue | null>(null);

/**
 * The colour and size a shopper has picked, shared across the product page.
 *
 * A context rather than state in the buy panel because the gallery sits in the
 * other column and has to swap when a colour is chosen. Passing a setter down
 * through a server-rendered layout is not possible, and hoisting the whole page
 * into one client component would ship the reviews and the related products to
 * the browser along with it.
 */
export function VariantChoiceProvider({
  product,
  children,
}: {
  product: Product;
  children: ReactNode;
}) {
  const start = initialChoice(product);
  const [colourId, setColourId] = useState<string | null>(start.colourId);
  const [label, setLabel] = useState<string>(start.label);

  const value = useMemo<VariantChoiceValue>(() => {
    const colours = sellableColours(product);
    const cells = sellableVariants(product);
    const variant = findVariant(product, colourId, label);

    // A choice is only complete once every axis the product actually has is
    // answered. A product with no cells at all needs nothing choosing.
    const incomplete =
      cells.length > 0 && (!variant || (colours.length > 0 && !colourId));

    return {
      colourId,
      label,
      setColour: setColourId,
      setLabel,
      variant,
      incomplete,
      soldOut: cells.length > 0 ? cells.every((cell) => cell.stock <= 0) : product.stock <= 0,
      available: variant ? variant.stock : cells.length > 0 ? 0 : product.stock,
      price: variant ? variant.price : product.price,
      images: imagesForColour(product, colourId),
    };
  }, [product, colourId, label]);

  return <VariantChoiceContext.Provider value={value}>{children}</VariantChoiceContext.Provider>;
}

export function useVariantChoice(): VariantChoiceValue {
  const context = useContext(VariantChoiceContext);
  if (!context) throw new Error("useVariantChoice must be used within a VariantChoiceProvider");
  return context;
}
