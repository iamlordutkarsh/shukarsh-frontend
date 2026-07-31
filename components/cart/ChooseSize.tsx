"use client";

import { useEffect, useState } from "react";
import { getProduct } from "../../lib/api";
import { cartLineKey, useCart, type CartItem } from "../../lib/cart";
import type { Product } from "../../lib/types";
import { sellableVariants, variantName } from "../../lib/variants";

/**
 * Asks for a colour and size on a line that has none.
 *
 * A bag is saved in the browser, so one packed before a product had options
 * outlives the change and would be refused at checkout with no way to fix it
 * from here. The options usually come from the snapshot already in the bag; only
 * a line saved before the field existed has to go and ask, so the common case
 * costs no request.
 *
 * Every buyable combination is listed flat rather than as two pickers. This is a
 * repair for a handful of stale lines, not the place anybody shops, and one row
 * of buttons is less to get wrong than a matrix inside a cart row.
 */
export function ChooseSize({ item, className }: { item: CartItem; className?: string }) {
  const { setLineVariant } = useCart();
  // Widened on purpose: a snapshot saved by an older build has no such field,
  // whatever the type of a freshly fetched product says.
  const known: Product["variants"] | undefined = item.product.variants;
  const [fetched, setFetched] = useState<Product | null>(null);

  useEffect(() => {
    if (known !== undefined || item.variantId) return;

    let live = true;
    getProduct(item.product.slug)
      .then((data) => {
        if (live) setFetched(data.product);
      })
      // A product that will not load is not an options problem, and the checkout
      // will say so properly. Nothing useful to show here.
      .catch(() => {
        if (live) setFetched(null);
      });

    return () => {
      live = false;
    };
  }, [known, item.variantId, item.product.slug]);

  if (item.variantId) return null;

  // The snapshot in the bag carries the colours it was saved with, so the names
  // come from whichever copy of the product we actually have.
  const product = known !== undefined ? item.product : fetched;
  if (!product) return null;

  const options = sellableVariants(product);
  if (options.length === 0) return null;

  const colourName = (colourId: string | null) =>
    (product.colours ?? []).find((colour) => colour.id === colourId)?.name ?? null;

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-rose-500">
        This now comes in options. Pick one to check out.
      </p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {options.map((option) => {
          const colour = colourName(option.colourId);

          return (
            <button
              key={option.id}
              type="button"
              disabled={option.stock <= 0}
              onClick={() =>
                setLineVariant(cartLineKey(item), {
                  id: option.id,
                  label: option.label,
                  colour,
                })
              }
              className="rounded-full bg-lavender-50 px-3 py-1 text-xs font-bold text-lavender-700 transition-colors hover:bg-lavender-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {variantName(colour, option.label) ?? product.name}
              {option.stock <= 0 ? " · sold out" : ""}
            </button>
          );
        })}
      </div>
    </div>
  );
}
