"use client";

import { useEffect, useState } from "react";
import { getProduct } from "../../lib/api";
import { cartLineKey, useCart, type CartItem } from "../../lib/cart";
import type { ProductVariant } from "../../lib/types";

/**
 * Asks for a size on a line that has none.
 *
 * A bag is saved in the browser, so one packed before a product had sizes
 * outlives the change and would be refused at checkout with no way to fix it
 * from here. The sizes usually come from the snapshot already in the bag; only a
 * line saved before the field existed has to go and ask, so the common case
 * costs no request.
 */
export function ChooseSize({ item, className }: { item: CartItem; className?: string }) {
  const { setLineVariant } = useCart();
  // Widened on purpose: a snapshot saved by an older build has no such field,
  // whatever the type of a freshly fetched product says.
  const known: ProductVariant[] | undefined = item.product.variants;
  const [fetched, setFetched] = useState<ProductVariant[] | null>(null);

  useEffect(() => {
    if (known !== undefined || item.variantId) return;

    let live = true;
    getProduct(item.product.slug)
      .then((data) => {
        if (live) setFetched(data.product.variants ?? []);
      })
      // A product that will not load is not a size problem, and the checkout
      // will say so properly. Nothing useful to show here.
      .catch(() => {
        if (live) setFetched([]);
      });

    return () => {
      live = false;
    };
  }, [known, item.variantId, item.product.slug]);

  if (item.variantId) return null;

  const sizes = (known ?? fetched)?.filter((variant) => variant.isActive) ?? [];
  if (sizes.length === 0) return null;

  return (
    <div className={className}>
      <p className="text-xs font-semibold text-rose-500">This now comes in sizes. Pick one to check out.</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {sizes.map((size) => (
          <button
            key={size.id}
            type="button"
            disabled={size.stock <= 0}
            onClick={() => setLineVariant(cartLineKey(item), { id: size.id, label: size.label })}
            className="rounded-full bg-lavender-50 px-3 py-1 text-xs font-bold text-lavender-700 transition-colors hover:bg-lavender-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {size.label}
            {size.stock <= 0 ? " · sold out" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}
