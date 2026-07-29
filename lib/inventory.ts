import type { ManualStockReason, Product, StockMoveReason } from "./types";

/** Matches the column default on the server, for a product saved before it existed. */
const FALLBACK_THRESHOLD = 5;

export function reorderLevel(product: Pick<Product, "lowStockThreshold">): number {
  return product.lowStockThreshold ?? FALLBACK_THRESHOLD;
}

/**
 * Whether this needs reordering.
 *
 * One definition for the badge in the catalogue, the dashboard count and the
 * "only a few left" nudge on the storefront, which were three separate hard-coded
 * fives before and could not be moved without finding all three.
 */
export function isLowStock(product: Pick<Product, "stock" | "lowStockThreshold">): boolean {
  return product.stock <= reorderLevel(product);
}

export const stockReasonLabel: Record<StockMoveReason, string> = {
  INITIAL: "Opening stock",
  SALE: "Sold",
  CANCELLATION: "Order cancelled",
  REOPEN: "Order reopened",
  RETURN_RESTOCK: "Returned, resellable",
  RECEIVED: "Stock received",
  CORRECTION: "Recounted",
  DAMAGE: "Damaged or lost",
};

export const manualReasons: { value: ManualStockReason; label: string; hint: string }[] = [
  { value: "RECEIVED", label: "Received", hint: "New stock arrived." },
  { value: "CORRECTION", label: "Recounted", hint: "The shelf did not match." },
  { value: "DAMAGE", label: "Damaged or lost", hint: "Written off." },
];

/**
 * The reason to offer first, from the direction of the movement. Adding stock is
 * almost always a delivery arriving; taking it away is almost always breakage.
 */
export function defaultReasonFor(delta: number): ManualStockReason {
  return delta >= 0 ? "RECEIVED" : "DAMAGE";
}
