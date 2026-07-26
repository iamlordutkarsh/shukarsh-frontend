"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { CheckCircle2, Clock, ExternalLink, Package, RotateCcw, Truck, XCircle } from "lucide-react";
import { trackOrder } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { Order, Tracking } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { PastelTile } from "../ui/PastelTile";

const statusMeta: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-peach-100 text-peach-400" },
  PROCESSING: { label: "Packing", icon: Package, className: "bg-lavender-100 text-lavender-700" },
  SHIPPED: { label: "Shipped", icon: Truck, className: "bg-blush-100 text-blush-500" },
  DELIVERED: { label: "Delivered", icon: CheckCircle2, className: "bg-mint-100 text-mint-400" },
  CANCELLED: { label: "Cancelled", icon: XCircle, className: "bg-rose-50 text-rose-500" },
  RETURNED: { label: "Returned", icon: RotateCcw, className: "bg-rose-50 text-rose-500" },
};

const paymentMeta: Record<string, string> = {
  PAID: "text-mint-400",
  PENDING: "text-peach-400",
  FAILED: "text-rose-500",
  REFUNDED: "text-lavender-700",
};

const steps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

function formatEventDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function OrderCard({ order }: { order: Order }) {
  const { token } = useAuth();
  const reduced = useReducedMotion();
  const meta = statusMeta[order.status] ?? statusMeta.PENDING;
  const StatusIcon = meta!.icon;
  const activeStep = Math.max(0, steps.indexOf(order.status));
  const closed = order.status === "CANCELLED" || order.status === "RETURNED";

  const shipment = order.shipment ?? null;
  const awb = shipment?.awb ?? null;

  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingError, setTrackingError] = useState("");

  const handleTrack = async () => {
    if (trackingOpen) {
      setTrackingOpen(false);
      return;
    }

    setTrackingOpen(true);
    if (tracking || !token) return;

    setTrackingLoading(true);
    setTrackingError("");

    try {
      const data = await trackOrder(token, order.id);
      setTracking(data.tracking);
      if (!data.tracking) setTrackingError("The courier has not scanned this parcel yet.");
    } catch (error) {
      setTrackingError(error instanceof Error ? error.message : "Could not fetch tracking right now.");
    } finally {
      setTrackingLoading(false);
    }
  };

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

      {!closed && (
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

      {awb && (
        <section className="mt-5 rounded-3xl bg-lavender-50/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-lavender-700">
                <Truck className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                {shipment?.courierName ?? "On its way"}
              </p>
              <p className="mt-1 font-mono text-xs text-ink">{awb}</p>
            </div>

            <button
              type="button"
              onClick={handleTrack}
              aria-expanded={trackingOpen}
              className="shrink-0 rounded-full bg-surface px-4 py-2 text-xs font-bold text-lavender-700 shadow-soft transition-colors hover:text-lavender-600"
            >
              {trackingLoading ? "Checking…" : trackingOpen ? "Hide tracking" : "Track parcel"}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {trackingOpen && (
              <motion.div
                initial={reduced ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-4">
                  {trackingLoading ? (
                    <p className="text-xs text-muted">Fetching the latest scans…</p>
                  ) : trackingError ? (
                    <p className="text-xs text-muted">{trackingError}</p>
                  ) : tracking ? (
                    <>
                      {(tracking.currentStatus || tracking.etd) && (
                        <p className="text-xs font-semibold text-ink">
                          {tracking.currentStatus ?? "In transit"}
                          {tracking.etd ? ` · expected ${tracking.etd.split(" ")[0]}` : ""}
                        </p>
                      )}

                      {tracking.events.length > 0 ? (
                        <ol className="mt-3 space-y-3 border-l border-lavender-200 pl-4">
                          {tracking.events.map((event, index) => (
                            <li key={`${event.date}-${index}`} className="relative">
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute -left-[1.3125rem] top-1 h-2 w-2 rounded-full",
                                  index === 0 ? "bg-lavender-500" : "bg-lavender-200"
                                )}
                              />
                              <p className="text-xs font-semibold text-ink">
                                {event.statusLabel ?? event.activity ?? event.status ?? "Update"}
                              </p>
                              <p className="text-[0.6875rem] text-muted">
                                {[formatEventDate(event.date), event.location].filter(Boolean).join(" · ")}
                              </p>
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <p className="mt-2 text-xs text-muted">No scans have been recorded yet.</p>
                      )}

                      {tracking.trackUrl && (
                        <a
                          href={tracking.trackUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-lavender-700 hover:text-lavender-600"
                        >
                          Open courier page
                          <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                        </a>
                      )}
                    </>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      <footer className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-muted">
          <span>Items</span>
          <span className="font-semibold text-ink">{formatPrice(order.itemsTotal)}</span>
        </div>
        <div className="flex justify-between text-muted">
          <span>Shipping</span>
          <span className="font-semibold text-ink">
            {order.shippingAmount > 0 ? formatPrice(order.shippingAmount) : "Free"}
          </span>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <span className="text-sm text-muted">Total paid</span>
          <span className="text-lg font-bold text-ink">{formatPrice(order.totalAmount)}</span>
        </div>
      </footer>
    </article>
  );
}
