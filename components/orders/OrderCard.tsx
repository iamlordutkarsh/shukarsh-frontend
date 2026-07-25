"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Clock, Package, Truck, XCircle } from "lucide-react";
import type { Order } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";

const statusMeta: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-peach-100 text-peach-400" },
  PROCESSING: { label: "Packing", icon: Package, className: "bg-lavender-100 text-lavender-700" },
  SHIPPED: { label: "Shipped", icon: Truck, className: "bg-blush-100 text-blush-500" },
  DELIVERED: { label: "Delivered", icon: CheckCircle2, className: "bg-mint-100 text-mint-400" },
  CANCELLED: { label: "Cancelled", icon: XCircle, className: "bg-rose-50 text-rose-500" },
};

const paymentMeta: Record<string, string> = {
  PAID: "text-mint-400",
  PENDING: "text-peach-400",
  FAILED: "text-rose-500",
  REFUNDED: "text-lavender-700",
};

const steps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

export function OrderCard({ order }: { order: Order }) {
  const meta = statusMeta[order.status] ?? statusMeta.PENDING;
  const StatusIcon = meta!.icon;
  const activeStep = Math.max(0, steps.indexOf(order.status));
  const cancelled = order.status === "CANCELLED";

  return (
    <article className="rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
            Order #{order.id.slice(0, 8)}
          </p>
          <p className="mt-1 text-sm text-muted">
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
              meta!.className
            )}
          >
            <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
            {meta!.label}
          </span>
          <span className={cn("text-[0.6875rem] font-bold uppercase tracking-[0.14em]", paymentMeta[order.paymentStatus] ?? "text-faint")}>
            {order.paymentStatus.toLowerCase()}
          </span>
        </div>
      </header>

      {!cancelled && (
        <div className="mt-5" aria-label={`Order progress: ${meta!.label}`}>
          <div className="flex items-center gap-1.5">
            {steps.map((step, index) => (
              <span
                key={step}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  index <= activeStep ? "bg-gradient-to-r from-lavender-500 to-blush-400" : "bg-lavender-100"
                )}
              />
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[0.625rem] font-bold uppercase tracking-[0.14em] text-faint">
            {steps.map((step, index) => (
              <span key={step} className={index <= activeStep ? "text-lavender-700" : undefined}>
                {statusMeta[step]?.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-center gap-3">
            <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-2xl bg-lavender-50">
              {item.product?.images?.[0] ? (
                <Image src={item.product.images[0]} alt="" fill sizes="48px" className="object-cover" />
              ) : (
                <PastelTile seed={item.productId} />
              )}
            </span>
            <span className="min-w-0 flex-1">
              {item.product?.slug ? (
                <Link
                  href={`/products/${item.product.slug}`}
                  className="block truncate text-sm font-semibold text-ink transition-colors hover:text-lavender-700"
                >
                  {item.product.name}
                </Link>
              ) : (
                <span className="block truncate text-sm font-semibold text-ink">Item</span>
              )}
              <span className="block text-xs text-muted">Qty {item.quantity}</span>
            </span>
            <span className="shrink-0 text-sm font-bold text-ink">{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <footer className="mt-5 flex items-baseline justify-between border-t border-line pt-4">
        <span className="text-sm text-muted">Total paid</span>
        <span className="text-lg font-bold text-ink">{formatPrice(order.totalAmount)}</span>
      </footer>
    </article>
  );
}
