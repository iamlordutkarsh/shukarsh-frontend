"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { EmptyState } from "../../../components/ui/EmptyState";
import { EmptyCartArt } from "../../../components/ui/KawaiiArt";
import { Pill } from "../../../components/ui/Pill";
import { Skeleton } from "../../../components/ui/Skeleton";
import { getOrders } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { Order } from "../../../lib/types";
import { cn, formatPrice } from "../../../lib/utils";

type AdminOrder = Order & { email?: string | null; user?: { email?: string | null } | null };

const statusTones: Record<string, "peach" | "lavender" | "blush" | "mint" | "ink"> = {
  PENDING: "peach",
  PROCESSING: "lavender",
  SHIPPED: "blush",
  DELIVERED: "mint",
  CANCELLED: "ink",
};

const paymentClasses: Record<string, string> = {
  PAID: "bg-mint-100 text-mint-400",
  PENDING: "bg-peach-100 text-peach-400",
  FAILED: "bg-rose-50 text-rose-500",
  REFUNDED: "bg-lavender-100 text-lavender-700",
};

function customerOf(order: AdminOrder) {
  return order.customerEmail ?? order.email ?? order.user?.email ?? order.shippingAddress?.email ?? null;
}

function shippingLineOf(order: AdminOrder) {
  const address = order.shippingAddress;
  if (!address) return null;
  const parts = [address.city, address.state, address.zip].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const reduced = useReducedMotion();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let active = true;

    getOrders(token)
      .then((data) => {
        if (active) setOrders(data.orders);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Failed to load orders");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const paidTotal = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + Number(order.totalAmount), 0);

  return (
    <AdminLayout
      title="Orders"
      subtitle="Every order, newest first. Open one to see exactly what was packed."
      actions={
        !loading && orders.length > 0 ? (
          <div className="rounded-3xl bg-surface/90 px-4 py-2.5 text-right shadow-soft hairline">
            <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Paid total</span>
            <span className="mt-0.5 block text-sm font-bold text-ink">{formatPrice(paidTotal)}</span>
          </div>
        ) : undefined
      }
    >
      {error && <p className="mb-5 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading orders">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-4xl" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          art={<EmptyCartArt />}
          title="No orders yet"
          description="Once someone checks out, their order lands here instantly."
        />
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const open = expanded === order.id;
            const customer = customerOf(order);
            const shipping = shippingLineOf(order);

            return (
              <li key={order.id} className="overflow-hidden rounded-4xl bg-surface/90 shadow-soft hairline">
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : order.id)}
                  aria-expanded={open}
                  aria-controls={`order-items-${order.id}`}
                  className="flex w-full flex-wrap items-center gap-4 p-5 text-left transition-colors hover:bg-lavender-50/60"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block font-mono text-xs font-semibold text-ink">#{order.id.slice(0, 8)}</span>
                    <span className="mt-1 block truncate text-sm font-semibold text-ink">
                      {order.customerName ?? customer ?? "Guest checkout"}
                    </span>
                    {order.customerName && customer && (
                      <span className="mt-0.5 block truncate text-xs text-muted">{customer}</span>
                    )}
                    <span className="mt-0.5 block text-xs text-muted">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {order.items.length} item{order.items.length === 1 ? "" : "s"}
                      {shipping ? ` · ${shipping}` : ""}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Pill tone={statusTones[order.status] ?? "lavender"}>{order.status.toLowerCase()}</Pill>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
                        paymentClasses[order.paymentStatus] ?? "bg-lavender-100 text-lavender-700"
                      )}
                    >
                      {order.paymentStatus.toLowerCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-base font-bold text-ink">{formatPrice(order.totalAmount)}</span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "h-4 w-4 text-faint transition-transform duration-200 ease-[var(--ease-soft)]",
                        open && "rotate-180"
                      )}
                      strokeWidth={2.4}
                    />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`order-items-${order.id}`}
                      initial={reduced ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-line px-5 pb-5 pt-4">
                        <ul className="space-y-3">
                          {order.items.map((item) => {
                            const image = item.product?.images?.[0];
                            return (
                              <li key={item.id} className="flex items-center gap-3">
                                <span className="relative h-12 w-11 shrink-0 overflow-hidden rounded-2xl bg-lavender-100">
                                  {image && <Image src={image} alt="" fill sizes="44px" className="object-cover" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-ink">
                                    {item.product?.name ?? "Item"}
                                  </span>
                                  <span className="block text-xs text-muted">
                                    Qty {item.quantity} · {formatPrice(item.price)} each
                                  </span>
                                </span>
                                <span className="shrink-0 text-sm font-bold text-ink">
                                  {formatPrice(Number(item.price) * item.quantity)}
                                </span>
                              </li>
                            );
                          })}
                        </ul>

                        {order.razorpayPaymentId && (
                          <p className="mt-4 font-mono text-xs text-faint">Payment {order.razorpayPaymentId}</p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      )}
    </AdminLayout>
  );
}
