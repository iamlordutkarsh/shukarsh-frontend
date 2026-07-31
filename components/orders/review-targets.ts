import type { Order, Review } from "../../lib/types";

export interface ReviewTarget {
  productId: string;
  name: string;
  image: string | null;
}

/**
 * What can be reviewed out of an order, once each.
 *
 * One entry per product rather than per line: the same thing bought twice is
 * still one opinion, and the API stores one row per person per product.
 */
export function reviewTargetsOf(order: Order): ReviewTarget[] {
  return [
    ...new Map(
      order.items.map((item) => [
        item.productId,
        {
          productId: item.productId,
          name: item.product?.name ?? "This item",
          image: item.product?.images?.[0] ?? null,
        },
      ])
    ).values(),
  ];
}

export function unreviewed(targets: ReviewTarget[], reviews: Record<string, Review>): ReviewTarget[] {
  return targets.filter((target) => !reviews[target.productId]);
}

/**
 * The next thing in the order nobody has said anything about.
 *
 * Looks after the current item first and then wraps, so working through an order
 * from the middle still reaches everything instead of stopping at the end.
 */
export function nextUnreviewed(
  targets: ReviewTarget[],
  reviews: Record<string, Review>,
  after: string
): ReviewTarget | null {
  const from = targets.findIndex((target) => target.productId === after);
  const rest = targets.slice(from + 1);

  return (
    unreviewed(rest, reviews)[0] ??
    unreviewed(targets, reviews).find((target) => target.productId !== after) ??
    null
  );
}
