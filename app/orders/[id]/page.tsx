"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowLeft, CreditCard, ExternalLink, MapPin, Package, Star, Truck, XCircle } from "lucide-react";
import { cancelOrder, getMyReviews, getOrder, trackOrder } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { Order, Review, Tracking } from "../../../lib/types";
import { cn, formatPrice } from "../../../lib/utils";
import { fadeUp, staggerParent } from "../../../lib/motion";
import { FloatingDecor } from "../../../components/motion/FloatingDecor";
import { Button, ButtonLink } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { useToast } from "../../../components/ui/Toast";
import { OopsArt } from "../../../components/ui/KawaiiArt";
import { PastelTile } from "../../../components/ui/PastelTile";
import { Skeleton, SkeletonText } from "../../../components/ui/Skeleton";
import { ReturnPanel } from "../../../components/orders/ReturnPanel";
import { ReviewDialog } from "../../../components/orders/ReviewDialog";
import { nextUnreviewed, reviewTargetsOf, unreviewed } from "../../../components/orders/review-targets";
import { Stars } from "../../../components/product/Stars";
import { WhatsAppIcon } from "../../../components/support/WhatsAppIcon";
import { orderSupportLink } from "../../../lib/support";
import { formatEtd, formatEventDate, formatPlacedAt, paymentMeta, statusMeta, steps } from "../../../components/orders/status";

export default function OrderDetailPage() {
  const { id } = useParams();
  const { user, token, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [trackingError, setTrackingError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  // Bumped after a return is opened or withdrawn, to pull the order again: the
  // eligibility and the requests on it are both decided by the server.
  const [refresh, setRefresh] = useState(0);

  // Keyed by product, so an item that has been reviewed shows the rating instead
  // of asking for one again.
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [reviewing, setReviewing] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!token || typeof id !== "string" || !order) return;
    const units = order.items.reduce((total, line) => total + line.quantity, 0);
    const confirmed = window.confirm(
      `Cancel order #${order.id.slice(0, 8)}?\n\n${units} item${units === 1 ? "" : "s"} will be released. ` +
        "If you have already paid, we will refund you to the same card or account. Write to us if you do not hear back."
    );
    if (!confirmed) return;

    setCancelling(true);
    try {
      const data = await cancelOrder(token, id);
      setOrder(data.order);
      toast({ title: "Order cancelled", description: "We have called it off for you.", tone: "success" });
    } catch (error) {
      toast({
        title: "Could not cancel",
        description: error instanceof Error ? error.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!token || typeof id !== "string") return;
    let active = true;

    getOrder(token, id)
      .then((data) => {
        if (active) setOrder(data.order);
      })
      .catch(() => {
        if (active) setNotFound(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token, id, refresh]);

  // Only for a delivered order, since nothing else can be reviewed, and in one
  // call for every item rather than one per line.
  useEffect(() => {
    if (!token || order?.status !== "DELIVERED") return;
    const ids = [...new Set(order.items.map((item) => item.productId))];
    if (ids.length === 0) return;

    let active = true;

    getMyReviews(token, ids)
      .then((data) => {
        if (!active) return;
        setMyReviews(Object.fromEntries(data.reviews.map((review) => [review.productId, review])));
      })
      // Silent on purpose: not knowing which are already reviewed costs a shopper
      // one confusing button, and is not worth a red toast on an order page.
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [token, order?.status, order?.items]);

  // Once a parcel has an AWB the scans are the most useful thing on this page,
  // so they load with it rather than waiting behind a button.
  useEffect(() => {
    if (!token || typeof id !== "string" || !order?.shipment?.awb) return;
    let active = true;

    trackOrder(token, id)
      .then((data) => {
        if (!active) return;
        setTracking(data.tracking);
        if (!data.tracking) setTrackingError("The courier has not scanned this parcel yet.");
      })
      .catch((error) => {
        if (active) setTrackingError(error instanceof Error ? error.message : "Could not fetch tracking right now.");
      });

    return () => {
      active = false;
    };
  }, [token, id, order?.shipment?.awb]);

  if (authLoading || loading) {
    return (
      <div className="section-shell py-16">
        <Skeleton className="h-8 w-40 rounded-full" />
        <div className="mt-8 space-y-4">
          <Skeleton className="h-32 rounded-4xl" />
          <Skeleton className="h-64 rounded-4xl" />
          <SkeletonText lines={3} />
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="section-shell py-16">
        <EmptyState
          art={<OopsArt />}
          title="We could not find that order"
          description="It may belong to another account, or the link is wrong."
        />
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/profile" variant="secondary">
            Back to my orders
          </ButtonLink>
        </div>
      </div>
    );
  }

  const meta = statusMeta[order.status] ?? statusMeta.PENDING;
  const StatusIcon = meta!.icon;
  const activeStep = Math.max(0, steps.indexOf(order.status));
  const closed = order.status === "CANCELLED" || order.status === "RETURNED";
  const shipment = order.shipment ?? null;
  const address = order.shippingAddress ?? null;
  // Derived rather than a state flag: the fetch is in flight for exactly as
  // long as a tracked parcel has produced neither scans nor an explanation.
  const trackingPending = Boolean(shipment?.awb) && !tracking && !trackingError;
  // Only while the shop has not started on it. After approval someone is
  // packing, so calling it off has to go through them.
  const canCancel = order.status === "PENDING";
  // The same condition the API enforces on a review. Offering it on a parcel
  // that is still moving would open a form that refuses them.
  const canReview = order.status === "DELIVERED";
  const chat = orderSupportLink(order.id);

  const reviewTargets = canReview ? reviewTargetsOf(order) : [];
  const openTarget = reviewTargets.find((target) => target.productId === reviewing) ?? null;

  return (
    <div className="relative pb-20 pt-10">
      <FloatingDecor className="h-[20rem] opacity-50" />

      <motion.div
        variants={staggerParent(0.06)}
        initial="hidden"
        animate="show"
        className="section-shell relative max-w-3xl"
      >
        <motion.div variants={fadeUp}>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2.4} />
            My orders
          </Link>
        </motion.div>

        <motion.header variants={fadeUp} className="mt-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-ink">Order #{order.id.slice(0, 8)}</h1>
            <p className="mt-1.5 text-sm text-muted">Placed {formatPlacedAt(order.createdAt)}</p>
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
            <span
              className={cn(
                "text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
                paymentMeta[order.paymentStatus] ?? "text-faint"
              )}
            >
              {order.paymentStatus.toLowerCase()}
            </span>
          </div>
        </motion.header>

        {!closed && (
          <motion.div
            variants={fadeUp}
            className="mt-7 rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline"
            aria-label={`Order progress: ${meta!.label}`}
          >
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
            <div className="mt-2.5 flex justify-between text-[0.625rem] font-bold uppercase tracking-[0.14em] text-faint">
              {steps.map((step, index) => (
                <span key={step} className={index <= activeStep ? "text-lavender-700" : undefined}>
                  {statusMeta[step]?.label}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {shipment?.awb && (
          <motion.section variants={fadeUp} className="mt-4 rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="flex items-center gap-2 font-display text-lg text-ink">
                  <Truck className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
                  Where your parcel is
                </h2>
                <p className="mt-1 text-xs text-muted">
                  {shipment.courierName ?? "Courier"} · <span className="font-mono text-ink">{shipment.awb}</span>
                </p>
              </div>
              {(tracking?.trackUrl ?? shipment.trackingUrl) && (
                <a
                  href={tracking?.trackUrl ?? shipment.trackingUrl ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-lavender-50 px-4 py-2 text-xs font-bold text-lavender-700 transition-colors hover:text-lavender-600"
                >
                  Courier page
                  <ExternalLink className="h-3 w-3" strokeWidth={2.5} />
                </a>
              )}
            </div>

            <div className="mt-4">
              {trackingPending ? (
                <div className="space-y-2.5" role="status" aria-label="Loading tracking">
                  <Skeleton className="h-4 w-48 rounded-full" />
                  <Skeleton className="h-4 w-64 rounded-full" />
                  <Skeleton className="h-4 w-40 rounded-full" />
                </div>
              ) : tracking && tracking.events.length > 0 ? (
                <>
                  {(tracking.currentStatus || tracking.etd) && (
                    <p className="mb-3 text-sm font-semibold text-ink">
                      {tracking.currentStatus ?? "In transit"}
                      {tracking.etd ? ` · expected ${formatEtd(tracking.etd)}` : ""}
                    </p>
                  )}
                  <ol className="space-y-3.5 border-l border-lavender-200 pl-4">
                    {tracking.events.map((event, index) => (
                      <li key={`${event.date}-${index}`} className="relative">
                        <span
                          aria-hidden
                          className={cn(
                            "absolute -left-[1.3125rem] top-1 h-2 w-2 rounded-full",
                            index === 0 ? "bg-lavender-500 ring-4 ring-lavender-100" : "bg-lavender-200"
                          )}
                        />
                        <p className="text-sm font-semibold text-ink">
                          {event.statusLabel ?? event.activity ?? event.status ?? "Update"}
                        </p>
                        <p className="text-xs text-muted">
                          {[formatEventDate(event.date), event.location].filter(Boolean).join(" · ")}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              ) : (
                <p className="text-sm text-muted">
                  {trackingError || "No scans have been recorded yet. Check back once the courier collects it."}
                </p>
              )}
            </div>
          </motion.section>
        )}

        <motion.section
          id="write-review"
          variants={fadeUp}
          className="mt-4 scroll-mt-28 rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline"
        >
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Package className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
            What you ordered
          </h2>

          {/* An order of several things cannot be reviewed in one go, so the
              link from order history lands here and this says which choice is
              being asked for. */}
          {canReview && (
            <p className="mt-1.5 text-xs text-muted">
              Pick the one you want to talk about. You can review each separately.
            </p>
          )}

          <ul className="mt-4 space-y-3.5">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center gap-3.5">
                <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-2xl bg-lavender-50">
                  {item.product?.images?.[0] ? (
                    <Image src={item.product.images[0]} alt="" fill sizes="56px" className="object-cover" />
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
                  <span className="block text-xs text-muted">
                    Qty {item.quantity} · {formatPrice(item.price)} each
                  </span>

                  {canReview &&
                    (myReviews[item.productId] ? (
                      <button
                        type="button"
                        onClick={() => setReviewing(item.productId)}
                        className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
                      >
                        <Stars value={myReviews[item.productId]!.rating} />
                        <span className="font-semibold">Edit your review</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewing(item.productId)}
                        className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-lavender-600 transition-colors hover:text-lavender-700"
                      >
                        <Star className="h-3.5 w-3.5" strokeWidth={2.4} />
                        Write a review
                      </button>
                    ))}
                </span>
                <span className="shrink-0 text-sm font-bold text-ink">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>Items</span>
              <span className="font-semibold text-ink">{formatPrice(order.itemsTotal)}</span>
            </div>
            {order.discountTotal > 0 && (
              <div className="flex justify-between text-mint-400">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span className="font-semibold">−{formatPrice(order.discountTotal)}</span>
              </div>
            )}
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
            {order.taxTotal > 0 && (
              <p className="text-xs text-faint">
                Includes GST {formatPrice(order.taxTotal)}
                {order.igstTotal > 0
                  ? " (IGST)"
                  : ` (CGST ${formatPrice(order.cgstTotal)} + SGST ${formatPrice(order.sgstTotal)})`}
              </p>
            )}
          </div>
        </motion.section>

        <motion.div variants={fadeUp} className="mt-4 grid gap-4 sm:grid-cols-2">
          {address && (
            <section className="rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline">
              <h2 className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
                <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
                Delivery address
              </h2>
              <p className="mt-2.5 text-sm font-semibold text-ink">{address.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {[address.line1, address.line2, address.city, address.state, address.zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {address.phone && <p className="mt-1.5 text-xs text-muted">{address.phone}</p>}
            </section>
          )}

          <section className="rounded-4xl bg-surface/90 p-5 shadow-soft sm:p-6 hairline">
            <h2 className="flex items-center gap-2 text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
              <CreditCard className="h-3.5 w-3.5" strokeWidth={2.5} />
              Payment
            </h2>
            <p className="mt-2.5 text-sm font-semibold text-ink">
              {order.paymentStatus === "PAID" ? "Paid via Razorpay" : `Payment ${order.paymentStatus.toLowerCase()}`}
            </p>
            <p className="mt-1 text-xs text-muted">{formatPlacedAt(order.createdAt)}</p>
            {order.razorpayPaymentId && (
              <p className="mt-1.5 break-all font-mono text-[0.6875rem] text-faint">{order.razorpayPaymentId}</p>
            )}
          </section>
        </motion.div>

        {token && (
          <motion.div variants={fadeUp}>
            <ReturnPanel order={order} token={token} onChanged={() => setRefresh((count) => count + 1)} />
          </motion.div>
        )}

        {chat && (
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">Something else about this order?</p>
            <a
              href={chat}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-soft transition-all hover:-translate-y-0.5 hover:text-mint-500 hairline"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Message us on WhatsApp
            </a>
          </motion.div>
        )}

        {canCancel && (
          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Changed your mind? You can call this off until we start packing it.
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              loading={cancelling}
              className="text-rose-500 hover:bg-rose-50"
            >
              <XCircle className="h-4 w-4" strokeWidth={2.4} />
              Cancel this order
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Keyed by product so moving to the next item remounts the fields with
          that item's own review, rather than clearing them one by one. */}
      {openTarget && token && (
        <ReviewDialog
          key={openTarget.productId}
          open
          target={openTarget}
          existing={myReviews[openTarget.productId] ?? null}
          token={token}
          remaining={
            unreviewed(reviewTargets, myReviews).filter(
              (target) => target.productId !== openTarget.productId
            ).length
          }
          onClose={() => setReviewing(null)}
          onSaved={(review) => setMyReviews((current) => ({ ...current, [review.productId]: review }))}
          onNext={() =>
            setReviewing(nextUnreviewed(reviewTargets, myReviews, openTarget.productId)?.productId ?? null)
          }
        />
      )}
    </div>
  );
}
