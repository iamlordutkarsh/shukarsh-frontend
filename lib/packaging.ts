/**
 * What the database falls back to when nobody fills the packaging boxes in.
 *
 * Two places need these numbers for opposite reasons: the product form puts them
 * in the empty fields, and the product list points out a row that still carries
 * all four, because an untouched parcel size is what makes a shipping quote
 * under-bill without ever looking wrong.
 */
export const DEFAULT_PACKAGING = {
  weightKg: 0.5,
  lengthCm: 15,
  breadthCm: 12,
  heightCm: 6,
} as const;

type Packaging = Pick<
  { weightKg: number; lengthCm: number; breadthCm: number; heightCm: number },
  "weightKg" | "lengthCm" | "breadthCm" | "heightCm"
>;

/**
 * A 0.5kg product genuinely packed in a 15x12x6 box looks exactly like one
 * nobody has measured, so all four matching is a prompt to go and check, not a
 * claim that the numbers are wrong. Requiring all four keeps it quiet once
 * somebody has clearly been through the form.
 */
export function usesDefaultPackaging(product: Packaging): boolean {
  return (
    product.weightKg === DEFAULT_PACKAGING.weightKg &&
    product.lengthCm === DEFAULT_PACKAGING.lengthCm &&
    product.breadthCm === DEFAULT_PACKAGING.breadthCm &&
    product.heightCm === DEFAULT_PACKAGING.heightCm
  );
}
