"use client";

import type { Product } from "../../lib/types";
import { discountPercent, formatPrice } from "../../lib/utils";
import { useVariantChoice } from "./VariantChoice";

/**
 * What the shopper is being asked to pay, once a colour and size are picked.
 *
 * Reads the choice rather than the product, because a cell may cost more than
 * the product it belongs to. Before anything is picked it shows the range, since
 * quoting the cheapest as though it were the price is how someone reaches
 * checkout at a number they did not agree to.
 *
 * comparePrice stays the product's own. It is what the piece is worth, not what
 * one size of it is, and striking through a figure that moves per size reads as
 * a different discount on every option.
 */
export function ProductPrice({ product }: { product: Product }) {
  const { variant, price } = useVariantChoice();

  const spread = product.priceTo > product.priceFrom;
  const showRange = !variant && spread;
  const shown = variant ? price : product.priceFrom;

  const comparePrice = product.comparePrice;
  // Only meaningful against a settled price. A range struck through against one
  // compare price is arithmetic nobody can follow.
  const discount = showRange ? null : discountPercent(shown, comparePrice);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-3xl font-bold tracking-tight text-ink">
          {showRange ? `${formatPrice(product.priceFrom)} – ${formatPrice(product.priceTo)}` : formatPrice(shown)}
        </span>

        {!showRange && comparePrice && comparePrice > shown && (
          <span className="text-base text-faint line-through">{formatPrice(comparePrice)}</span>
        )}

        {discount !== null && (
          <span className="text-sm font-semibold text-blush-500">
            You save {formatPrice(Number(comparePrice) - shown)}
          </span>
        )}
      </div>

      <p className="text-xs text-faint">
        Inclusive of all taxes
        {showRange && <span className="ml-1.5">· price depends on the option you pick</span>}
      </p>
    </div>
  );
}
