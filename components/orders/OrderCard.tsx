"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Order } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";
import { formatPlacedAt, paymentMeta, statusMeta, summaryLineOf } from "./status";

/** Covers of what was bought, so a row is recognisable at a glance. */
function OrderThumbs({ order }: { order: Order }) {
  const shown = order.items.slice(0, 3);

  return (
    <span className="flex shrink-0 -space-x-2.5">
      {shown.map((item, index) => (
        <span
          key={item.id}
          className="relative h-11 w-11 overflow-hidden rounded-2xl bg-lavender-50 ring-2 ring-surface"
          style={{ zIndex: shown.length - index }}
        >
          {item.product?.images?.[0] ? (
            <Image src={item.product.images[0]} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            <PastelTile seed={item.productId} />
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * One line per order, linking to the full detail page.
 *
 * Everything about an order used to live inline here, which made a single
 * eight item order taller than the screen and buried the tracking three
 * clicks deep. The row is now a summary and nothing else.
 */
export function OrderCard({ order }: { order: Order }) {
  const meta = statusMeta[order.status] ?? statusMeta.PENDING;
  const StatusIcon = meta!.icon;
  const units = order.items.reduce((total, item) => total + item.quantity, 0);

  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-4 rounded-4xl bg-surface/90 p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lift sm:p-6 hairline"
    >
      <OrderThumbs order={order} />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
            #{order.id.slice(0, 8)}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.14em]",
              meta!.className
            )}
          >
            <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
            {meta!.label}
          </span>
        </span>

        <span className="mt-1 block truncate text-sm font-semibold text-ink">{summaryLineOf(order.items)}</span>

        <span className="mt-0.5 block text-xs text-muted">
          {formatPlacedAt(order.createdAt)} · {units} item{units === 1 ? "" : "s"}
        </span>
      </span>

      <span className="flex shrink-0 items-center gap-3">
        <span className="text-right">
          <span className="block text-sm font-bold text-ink">{formatPrice(order.totalAmount)}</span>
          <span
            className={cn(
              "block text-[0.625rem] font-bold uppercase tracking-[0.14em]",
              paymentMeta[order.paymentStatus] ?? "text-faint"
            )}
          >
            {order.paymentStatus.toLowerCase()}
          </span>
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-faint" strokeWidth={2.5} />
      </span>
    </Link>
  );
}
