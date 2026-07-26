"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronDown, RefreshCw, Truck } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { ShippingDrawer } from "../../../components/admin/ShippingDrawer";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { EmptyCartArt } from "../../../components/ui/KawaiiArt";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { getOrders, syncTracking, updateOrderStatus } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import { Order, Shipment } from "../../../lib/types";
import { cn, formatPrice } from "../../../lib/utils";

type AdminOrder = Order & { email?: string | null; user?: { email?: string | null } | null };

const ORDER_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"] as const;

/** The fulfilment path, in the order the work actually happens. */
const TABS = [
  { key: "PENDING", label: "To approve", empty: "Nothing waiting on you." },
  { key: "PROCESSING", label: "Packing", empty: "Nothing to pack." },
  { key: "SHIPPED", label: "In transit", empty: "Nothing on the road." },
  { key: "DELIVERED", label: "Delivered", empty: "No deliveries yet." },
  { key: "CLOSED", label: "Cancelled", empty: "No cancellations." },
  { key: "ALL", label: "All", empty: "No orders yet." },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function inTab(order: Order, tab: TabKey) {
  if (tab === "ALL") return true;
  if (tab === "CLOSED") return order.status === "CANCELLED" || order.status === "RETURNED";
  return order.status === tab;
}

const statusClasses: Record<string, string> = {
  PENDING: "bg-peach-100 text-peach-400",
  PROCESSING: "bg-lavender-100 text-lavender-700",
  SHIPPED: "bg-blush-100 text-blush-500",
  DELIVERED: "bg-mint-100 text-mint-400",
  CANCELLED: "bg-ink-900 text-white",
  RETURNED: "bg-rose-50 text-rose-500",
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
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [shippingId, setShippingId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("PENDING");
  const [syncing, setSyncing] = useState(false);

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

  const replaceOrder = (next: Order) =>
    setOrders((current) => current.map((order) => (order.id === next.id ? { ...order, ...next } : order)));

  const replaceShipment = (orderId: string, shipment: Shipment) =>
    setOrders((current) => current.map((order) => (order.id === orderId ? { ...order, shipment } : order)));

  /**
   * Cancelling or reopening a paid order moves real stock, and cancelling one
   * that is already on its way leaves the courier holding a live AWB. Both are
   * a single click on a dropdown, so say what will happen first.
   */
  const confirmStatus = (order: AdminOrder, next: string) => {
    if (order.paymentStatus !== "PAID") return true;

    const closing = next === "CANCELLED" || next === "RETURNED";
    const reopening = !closing && order.status !== next && ["CANCELLED", "RETURNED"].includes(order.status);
    const units = order.items.reduce((total, item) => total + item.quantity, 0);

    if (closing) {
      const awbWarning = order.shipment?.awb
        ? `\n\nThis order already has AWB ${order.shipment.awb}. Cancel the shipment in the shipping panel too, or the courier will still collect it.`
        : "";
      return window.confirm(
        `Mark order #${order.id.slice(0, 8)} as ${next.toLowerCase()}?\n\n${units} unit${
          units === 1 ? "" : "s"
        } will go back into stock.${awbWarning}`
      );
    }

    if (reopening) {
      return window.confirm(
        `Reopen order #${order.id.slice(0, 8)} as ${next.toLowerCase()}?\n\n${units} unit${
          units === 1 ? "" : "s"
        } will be taken out of stock again.`
      );
    }

    return true;
  };

  const handleStatus = async (order: AdminOrder, status: string) => {
    if (!token) return;
    if (!confirmStatus(order, status)) return;

    const id = order.id;
    setSavingId(id);

    try {
      const data = await updateOrderStatus(token, id, status);
      replaceOrder(data.order);
      toast({ title: "Order updated", description: `Marked as ${status.toLowerCase()}.`, tone: "success" });
    } catch (err) {
      toast({
        title: "Could not update this order",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSavingId(null);
    }
  };

  const handleSync = async () => {
    if (!token) return;
    setSyncing(true);

    try {
      const result = await syncTracking(token);

      if (result.advanced > 0) {
        const refreshed = await getOrders(token);
        setOrders(refreshed.orders);
      }

      toast({
        title:
          result.checked === 0
            ? "Nothing in transit"
            : `${result.advanced} order${result.advanced === 1 ? "" : "s"} moved on`,
        description:
          result.checked === 0
            ? "No shipments are waiting on a courier update."
            : `Checked ${result.checked} shipment${result.checked === 1 ? "" : "s"} with the courier.`,
        tone: "success",
      });
    } catch (err) {
      toast({
        title: "Could not refresh tracking",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSyncing(false);
    }
  };

  const paidTotal = orders
    .filter((order) => order.paymentStatus === "PAID")
    .reduce((total, order) => total + Number(order.totalAmount), 0);

  const shippingOrder = orders.find((order) => order.id === shippingId) ?? null;
  const visible = orders.filter((order) => inTab(order, tab));
  const activeTab = TABS.find((entry) => entry.key === tab)!;

  return (
    <AdminLayout
      title="Orders"
      subtitle="Every order, newest first. Open one to see exactly what was packed."
      actions={
        !loading && orders.length > 0 ? (
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={handleSync} loading={syncing}>
              <RefreshCw className="h-4 w-4" strokeWidth={2.4} />
              Refresh tracking
            </Button>
            <div className="rounded-3xl bg-surface/90 px-4 py-2.5 text-right shadow-soft hairline">
              <span className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
                Paid total
              </span>
              <span className="mt-0.5 block text-sm font-bold text-ink">{formatPrice(paidTotal)}</span>
            </div>
          </div>
        ) : undefined
      }
    >
      {error && <p className="mb-5 rounded-3xl bg-rose-50 px-4 py-3 text-sm text-rose-500">{error}</p>}

      {!loading && orders.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Order stage">
          {TABS.map((entry) => {
            const count = orders.filter((order) => inTab(order, entry.key)).length;
            const active = entry.key === tab;

            return (
              <button
                key={entry.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(entry.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  active
                    ? "bg-gradient-to-r from-lavender-500 to-blush-400 text-white shadow-soft"
                    : "bg-surface/90 text-muted shadow-soft hover:text-ink hairline"
                )}
              >
                {entry.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.6875rem] font-bold",
                    active ? "bg-white/25 text-white" : "bg-lavender-100 text-lavender-700"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
      ) : visible.length === 0 ? (
        <EmptyState compact art={<EmptyCartArt />} title={activeTab.empty} description="" />
      ) : (
        <ul className="space-y-3">
          {visible.map((order) => {
            const open = expanded === order.id;
            const customer = customerOf(order);
            const shipping = shippingLineOf(order);
            const awb = order.shipment?.awb ?? null;

            return (
              <li key={order.id} className="overflow-hidden rounded-4xl bg-surface/90 shadow-soft hairline">
                <div className="flex flex-wrap items-center gap-3 p-5">
                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : order.id)}
                    aria-expanded={open}
                    aria-controls={`order-items-${order.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="min-w-0 flex-1">
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
                      {awb && (
                        <span className="mt-1 block truncate font-mono text-xs text-lavender-700">
                          {order.shipment?.courierName ? `${order.shipment.courierName} · ` : ""}
                          {awb}
                        </span>
                      )}
                    </span>

                    <span className="shrink-0 text-base font-bold text-ink">{formatPrice(order.totalAmount)}</span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "h-4 w-4 shrink-0 text-faint transition-transform duration-200 ease-[var(--ease-soft)]",
                        open && "rotate-180"
                      )}
                      strokeWidth={2.4}
                    />
                  </button>

                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-[0.6875rem] font-bold uppercase tracking-[0.14em]",
                        paymentClasses[order.paymentStatus] ?? "bg-lavender-100 text-lavender-700"
                      )}
                    >
                      {order.paymentStatus.toLowerCase()}
                    </span>

                    <select
                      aria-label={`Status for order ${order.id.slice(0, 8)}`}
                      value={order.status}
                      disabled={savingId === order.id}
                      onChange={(event) => handleStatus(order, event.target.value)}
                      className={cn(
                        "h-9 cursor-pointer rounded-full border-0 px-3 text-[0.6875rem] font-bold uppercase tracking-[0.14em] outline-none transition-opacity focus:ring-2 focus:ring-lavender-400 disabled:opacity-50",
                        statusClasses[order.status] ?? "bg-lavender-100 text-lavender-700"
                      )}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status} className="bg-surface text-ink">
                          {status.toLowerCase()}
                        </option>
                      ))}
                    </select>

                    {order.status === "PENDING" && order.paymentStatus === "PAID" ? (
                      <Button
                        size="sm"
                        onClick={() => handleStatus(order, "PROCESSING")}
                        loading={savingId === order.id}
                      >
                        <Check className="h-4 w-4" strokeWidth={2.6} />
                        Approve
                      </Button>
                    ) : (
                      <Button variant="secondary" size="sm" onClick={() => setShippingId(order.id)}>
                        <Truck className="h-4 w-4" strokeWidth={2.4} />
                        {awb ? "Shipping" : "Ship"}
                      </Button>
                    )}
                  </div>
                </div>

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

                        <dl className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs">
                          <div className="flex gap-1.5">
                            <dt className="text-muted">Items</dt>
                            <dd className="font-semibold text-ink">{formatPrice(order.itemsTotal)}</dd>
                          </div>
                          <div className="flex gap-1.5">
                            <dt className="text-muted">Shipping</dt>
                            <dd className="font-semibold text-ink">
                              {formatPrice(order.shippingAmount)}
                              {order.courierName ? ` · ${order.courierName}` : ""}
                            </dd>
                          </div>
                        </dl>

                        {order.razorpayPaymentId && (
                          <p className="mt-3 font-mono text-xs text-faint">Payment {order.razorpayPaymentId}</p>
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

      {/* Keyed so tracking and pickup state never leak between orders. */}
      <ShippingDrawer
        key={shippingId ?? "closed"}
        order={shippingOrder}
        open={shippingOrder !== null}
        onClose={() => setShippingId(null)}
        onOrderChange={replaceOrder}
        onShipmentChange={replaceShipment}
      />
    </AdminLayout>
  );
}
