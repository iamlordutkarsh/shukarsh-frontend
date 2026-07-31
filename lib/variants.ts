import type { Product, ProductColour, ProductVariant } from "./types";

/**
 * Which colours a shopper may pick.
 *
 * A colour with no sellable cell under it is dropped: switching every size of a
 * colour off is how a shop retires it without deleting the orders that bought
 * it, and a swatch that leads to nothing to buy is worse than no swatch.
 */
export function sellableColours(product: Product): ProductColour[] {
  const cells = sellableVariants(product);
  return (product.colours ?? [])
    .filter((colour) => colour.isActive)
    .filter((colour) => cells.some((cell) => cell.colourId === colour.id));
}

/** The cells a shopper may pick. Withdrawn ones never reach the storefront. */
export function sellableVariants(product: Product): ProductVariant[] {
  return (product.variants ?? []).filter((variant) => variant.isActive);
}

/**
 * The sizes, in the order the shop put them, listed once each.
 *
 * Taken from the cells rather than stored separately, because the same size
 * exists once per colour and the picker draws one row of them. A product sold by
 * colour alone has none, which is what an empty label means.
 */
export function sellableSizes(product: Product): string[] {
  const sizes: string[] = [];
  for (const variant of sellableVariants(product)) {
    if (variant.label && !sizes.includes(variant.label)) sizes.push(variant.label);
  }
  return sizes;
}

/** The one cell a colour and a size name between them, if it is on sale. */
export function findVariant(
  product: Product,
  colourId: string | null,
  label: string
): ProductVariant | null {
  return (
    sellableVariants(product).find(
      (variant) => (variant.colourId ?? null) === colourId && variant.label === label
    ) ?? null
  );
}

/**
 * Whether a size can be had in a colour at all.
 *
 * Separate from whether it is in stock: a combination the shop never made is not
 * the same as one that sold out, and the picker says so differently.
 */
export function variantFor(
  product: Product,
  colourId: string | null,
  label: string
): { exists: boolean; stock: number } {
  const variant = findVariant(product, colourId, label);
  return { exists: Boolean(variant), stock: variant?.stock ?? 0 };
}

/** What a shopper sees this called: "Midnight blue · M". */
export function variantName(colourName: string | null, label: string): string | null {
  return [colourName, label].filter(Boolean).join(" · ") || null;
}

/**
 * The photos to show for a colour: its own, or the product's when it has none.
 *
 * A shop with one set of pictures should not be forced to upload them per
 * colour, so falling back is the normal case rather than the exception.
 */
export function imagesForColour(product: Product, colourId: string | null): string[] {
  if (!colourId) return product.images;
  const colour = (product.colours ?? []).find((option) => option.id === colourId);
  return colour && colour.images.length > 0 ? colour.images : product.images;
}

/** What is left of a product across every cell it sells, or its own stock. */
export function totalStock(product: Product): number {
  const cells = sellableVariants(product);
  if (cells.length === 0) return product.stock;
  return cells.reduce((sum, cell) => sum + cell.stock, 0);
}

/**
 * The choice a shopper starts on.
 *
 * One of anything is not a choice, so it is made for them: a product in one
 * colour opens on that colour, and one in a single size arrives with it already
 * picked. Anything more than one is left blank on purpose, because a default
 * size is how somebody buys the wrong one.
 */
export function initialChoice(product: Product): { colourId: string | null; label: string } {
  const colours = sellableColours(product);
  const sizes = sellableSizes(product);

  return {
    colourId: colours.length === 1 ? colours[0].id : null,
    label: sizes.length === 1 ? sizes[0] : "",
  };
}
