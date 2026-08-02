"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";
import { imageSrc } from "../../lib/images";
import type { Order, Review } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";
import { reviewTargetsOf, unreviewed } from "./review-targets";
import { formatPlacedAt, statusMeta, summaryLineOf } from "./status";

/**
 * Covers of what was bought.
 *
 * Fixed width whatever the item count, so the text beside it starts at the
 * same place on every row. A cluster that grew with the order made each row
 * begin at a different x and the list impossible to scan down.
 */
function OrderThumbs({ order, muted }: { order: Order; muted: boolean }) {
  const shown = order.items.slice(0, 3);

  // 6.75rem is exactly three 2.75rem covers overlapping by 0.75rem, so a row
  // with one cover and a row with three both end in the same place.
  return (
    <span className={cn("flex w-[6.75rem] shrink-0 -space-x-3", muted && "opacity-55 saturate-50")}>
      {shown.map((item, index) => (
        <span
          key={item.id}
          className="relative h-11 w-11 shrink-0 overflow-hidden rounded-2xl bg-lavender-50 ring-2 ring-surface"
          style={{ zIndex: shown.length - index }}
        >
          {item.product?.images?.[0] ? (
            <Image src={imageSrc(item.product.images[0])} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <PastelTile seed={item.productId} />
          )}
        </span>
      ))}
    </span>
  );
}

/** One line per order, linking to the full detail page. */
export function OrderCard({
  order,
  reviews,
  onReview,
}: {
  order: Order;
  /** The shopper's own reviews, keyed by product. Absent means not loaded. */
  reviews?: Record<string, Review>;
  /** Given, the row opens the popup itself instead of sending them to the order. */
  onReview?: (order: Order) => void;
}) {
  const meta = statusMeta[order.status] ?? statusMeta.PENDING;
  const StatusIcon = meta!.icon;
  const units = order.items.reduce((total, item) => total + item.quantity, 0);
  const closed = order.status === "CANCELLED" || order.status === "RETURNED";
  const unpaid = order.paymentStatus !== "PAID";
  // The same condition the API puts on a review, so the offer is never one the
  // form will refuse.
  const canReview = order.status === "DELIVERED";
  // The label has to say what is left to do, or someone who has reviewed two of
  // three items cannot tell this row apart from one they have not started.
  const targets = canReview ? reviewTargetsOf(order) : [];
  const products = targets.length;
  const left = reviews ? unreviewed(targets, reviews).length : products;

  return (
    // Not one big anchor any more. A link inside a link is invalid, and the
    // review needs to be a real second destination rather than a label that
    // quietly goes wherever the row goes. The title's ::after covers the card,
    // so the whole row still clicks through to the order.
    <div className="relative flex items-center gap-4 rounded-4xl bg-surface p-4 ring-1 ring-line-strong transition-all hover:-translate-y-0.5 hover:shadow-soft hover:ring-lavender-300 focus-within:ring-lavender-300 sm:gap-5 sm:p-5">
      <OrderThumbs order={order} muted={closed} />

      <span className="min-w-0 flex-1">
        <Link
          href={`/orders/${order.id}`}
          className={cn(
            "block truncate text-sm font-semibold after:absolute after:inset-0 after:content-['']",
            closed ? "text-muted" : "text-ink"
          )}
        >
          {summaryLineOf(order.items)}
        </Link>
        <span className="mt-1 block truncate text-xs text-faint">
          <span className="font-mono">#{order.id.slice(0, 8)}</span>
          {" · "}
          {formatPlacedAt(order.createdAt)}
          {" · "}
          {units} item{units === 1 ? "" : "s"}
        </span>

        {/* z-10 keeps this above the title link's overlay, which covers the row. */}
        {canReview && onReview && (
          <button
            type="button"
            onClick={() => onReview(order)}
            className="relative z-10 mt-1.5 inline-flex items-center gap-1 text-xs font-bold text-lavender-600 transition-colors hover:text-lavender-700"
          >
            <Star className="h-3.5 w-3.5" strokeWidth={2.4} />
            {left === 0 ? "Edit your reviews" : left < products ? `Review the other ${left}` : "Write a review"}
          </button>
        )}
      </span>

      <span className="flex shrink-0 items-center gap-3 sm:gap-4">
        <span className="flex flex-col items-end gap-1.5">
          <span className={cn("text-sm font-bold", closed ? "text-muted" : "text-ink")}>
            {formatPrice(order.totalAmount)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.12em]",
              meta!.className
            )}
          >
            <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
            {meta!.label}
          </span>
          {/* Only worth saying when it is not the norm. Every settled order is
              paid, so a green PAID on every row was noise competing with the
              one label that actually differs. */}
          {unpaid && (
            <span className="text-[0.625rem] font-bold uppercase tracking-[0.12em] text-peach-400">
              {/* On a cash order this is the arrangement, not a problem. */}
              {order.paymentMethod === "COD" ? "cash on delivery" : order.paymentStatus.toLowerCase()}
            </span>
          )}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-faint" strokeWidth={2.5} />
      </span>
    </div>
  );
}
