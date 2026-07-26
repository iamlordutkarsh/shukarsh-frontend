"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
  Package,
  Phone,
  RefreshCw,
  ScrollText,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import {
  cancelOrderShipment,
  generateOrderInvoice,
  generateOrderManifest,
  getOrderCourierOptions,
  schedulePickup,
  setOrderTracking,
  shipOrder,
  trackOrder,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { CourierOption, Order, Shipment, Tracking } from "../../lib/types";
import { cn, formatPrice } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Drawer } from "../ui/Drawer";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";

interface ShippingDrawerProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onOrderChange: (order: Order) => void;
  onShipmentChange: (orderId: string, shipment: Shipment) => void;
}

type BusyKey = "ship" | "pickup" | "invoice" | "manifest" | "cancel" | "track" | "manual" | null;

const manualFieldClass =
  "h-9 w-full rounded-2xl border-0 bg-surface px-3 text-sm text-ink ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-lavender-400";

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

function DocLink({ href, label, icon: Icon }: { href: string; label: string; icon: typeof FileText }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-2xl bg-lavender-50 px-4 py-3 text-sm font-semibold text-lavender-700 transition-colors hover:bg-lavender-100"
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.4} />
      {label}
      <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0" strokeWidth={2.4} />
    </a>
  );
}

export function ShippingDrawer({ order, open, onClose, onOrderChange, onShipmentChange }: ShippingDrawerProps) {
  const { token } = useAuth();
  const { toast } = useToast();

  const [quote, setQuote] = useState<{ orderId: string; options: CourierOption[]; error: string } | null>(null);
  const [preferredCourierId, setPreferredCourierId] = useState<number | null>(null);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [manual, setManual] = useState({ awb: "", courierName: "", trackingUrl: "" });
  const [busy, setBusy] = useState<BusyKey>(null);

  const orderId = order?.id ?? null;
  const shipment = order?.shipment ?? null;
  const address = order?.shippingAddress ?? {};
  const shipped = Boolean(shipment?.awb);
  const isManual = shipment?.provider === "manual";
  const paid = order?.paymentStatus === "PAID";
  const needsQuote = open && Boolean(token) && orderId !== null && !shipped && paid;

  /** Courier options only matter before an AWB exists. */
  useEffect(() => {
    if (!needsQuote || !token || !orderId) return;
    let active = true;

    getOrderCourierOptions(token, orderId)
      .then((data) => {
        if (active) setQuote({ orderId, options: data.options, error: "" });
      })
      .catch((error) => {
        if (!active) return;
        setQuote({
          orderId,
          options: [],
          error: error instanceof Error ? error.message : "Could not load courier options",
        });
      });

    return () => {
      active = false;
    };
  }, [needsQuote, token, orderId]);

  const settledQuote = quote?.orderId === orderId ? quote : null;
  const options = settledQuote?.options ?? [];
  const optionsError = settledQuote?.error ?? "";
  const optionsLoading = needsQuote && settledQuote === null;
  const selectedCourier =
    options.find((option) => option.courierId === preferredCourierId) ??
    options.find((option) => option.recommended) ??
    options[0] ??
    null;

  const run = useCallback(
    async (key: Exclude<BusyKey, null>, action: () => Promise<void>, failure: string) => {
      setBusy(key);
      try {
        await action();
      } catch (error) {
        toast({
          title: failure,
          description: error instanceof Error ? error.message : "Please try again.",
          tone: "error",
        });
      } finally {
        setBusy(null);
      }
    },
    [toast]
  );

  if (!order) return null;

  const handleShip = () =>
    run(
      "ship",
      async () => {
        const data = await shipOrder(token!, order.id, selectedCourier?.courierId);
        onOrderChange(data.order);
        toast({
          title: "Shipment created",
          description: data.order.shipment?.awb
            ? `AWB ${data.order.shipment.awb} via ${data.order.shipment.courierName ?? "courier"}.`
            : "Shiprocket has the order.",
          tone: "success",
        });
      },
      "Could not create this shipment"
    );

  const handleManualTracking = () =>
    run(
      "manual",
      async () => {
        const data = await setOrderTracking(token!, order.id, {
          awb: manual.awb.trim(),
          courierName: manual.courierName.trim() || undefined,
          trackingUrl: manual.trackingUrl.trim() || undefined,
        });
        onOrderChange(data.order);
        setManual({ awb: "", courierName: "", trackingUrl: "" });
        toast({
          title: "Tracking saved",
          description: "The order is marked shipped and the customer can track it.",
          tone: "success",
        });
      },
      "Could not save this tracking number"
    );

  const handlePickup = () =>
    run(
      "pickup",
      async () => {
        const data = await schedulePickup(token!, order.id, pickupDate || undefined);
        onShipmentChange(order.id, data.shipment);
        toast({
          title: "Pickup scheduled",
          description: formatDate(data.shipment.pickupScheduledAt) ?? "The courier has been notified.",
          tone: "success",
        });
      },
      "Could not schedule a pickup"
    );

  const handleInvoice = () =>
    run(
      "invoice",
      async () => {
        const data = await generateOrderInvoice(token!, order.id);
        onShipmentChange(order.id, data.shipment);
        toast({ title: "Invoice ready", tone: "success" });
      },
      "Could not generate an invoice"
    );

  const handleManifest = () =>
    run(
      "manifest",
      async () => {
        const data = await generateOrderManifest(token!, order.id);
        onShipmentChange(order.id, data.shipment);
        toast({ title: "Manifest ready", tone: "success" });
      },
      "Could not generate a manifest"
    );

  const handleCancel = () =>
    run(
      "cancel",
      async () => {
        const data = await cancelOrderShipment(token!, order.id);
        onShipmentChange(order.id, data.shipment);
        toast({ title: "Cancellation requested", description: "Shiprocket is cancelling this AWB.", tone: "info" });
      },
      "Could not cancel this shipment"
    );

  const handleTrack = () =>
    run(
      "track",
      async () => {
        const data = await trackOrder(token!, order.id);
        setTracking(data.tracking);
        if (!data.tracking) toast({ title: "No tracking yet", description: "The courier has not scanned it.", tone: "info" });
      },
      "Could not fetch tracking"
    );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Shipping"
      description={`Order #${order.id.slice(0, 8)}`}
      className="max-w-lg"
    >
      <div className="space-y-5">
        <section className="rounded-3xl bg-surface/80 p-4 hairline">
          <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Deliver to</h3>
          <p className="mt-2 text-sm font-semibold text-ink">{order.customerName ?? address.name ?? "Guest"}</p>
          {(order.customerPhone || address.phone) && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <Phone className="h-3 w-3 shrink-0" strokeWidth={2.4} />
              {order.customerPhone ?? address.phone}
            </p>
          )}
          <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted">
            <MapPin className="mt-0.5 h-3 w-3 shrink-0" strokeWidth={2.4} />
            <span>
              {[address.line1, address.line2, address.city, address.state, address.zip].filter(Boolean).join(", ")}
            </span>
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-line pt-3 text-xs">
            <div className="flex gap-1.5">
              <dt className="text-muted">Items</dt>
              <dd className="font-semibold text-ink">{formatPrice(order.itemsTotal)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted">Shipping</dt>
              <dd className="font-semibold text-ink">{formatPrice(order.shippingAmount)}</dd>
            </div>
            <div className="flex gap-1.5">
              <dt className="text-muted">Paid</dt>
              <dd className="font-semibold text-ink">{formatPrice(order.totalAmount)}</dd>
            </div>
          </dl>
        </section>

        {!paid ? (
          <p className="rounded-3xl bg-peach-100 px-4 py-3.5 text-sm text-peach-400">
            This order has not been paid for yet, so it cannot be shipped.
          </p>
        ) : !shipped ? (
          <section>
            <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
              <Truck className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
              Pick a courier
            </h3>

            {optionsLoading ? (
              <div className="mt-3 space-y-2" role="status" aria-label="Loading courier options">
                <Skeleton className="h-14 w-full rounded-2xl" />
                <Skeleton className="h-14 w-full rounded-2xl" />
              </div>
            ) : optionsError ? (
              <p className="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600">{optionsError}</p>
            ) : options.length === 0 ? (
              <p className="mt-3 text-sm text-muted">
                No courier is serviceable for this address right now. You can still create the shipment and assign an
                AWB later from Shiprocket.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {options.slice(0, 6).map((option) => {
                  const active = option.courierId === selectedCourier?.courierId;
                  return (
                    <li key={option.courierId}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-all",
                          active ? "bg-lavender-50 ring-2 ring-lavender-400" : "bg-surface ring-line hover:ring-lavender-300"
                        )}
                      >
                        <input
                          type="radio"
                          name="admin-courier"
                          className="h-4 w-4 shrink-0 accent-lavender-500"
                          checked={active}
                          onChange={() => setPreferredCourierId(option.courierId)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="truncate text-sm font-semibold text-ink">{option.courierName}</span>
                            {option.recommended && (
                              <Star className="h-3 w-3 shrink-0 text-mint-400" strokeWidth={3} />
                            )}
                          </span>
                          <span className="mt-0.5 block text-xs text-muted">
                            {option.etdDays ? `${option.etdDays} days` : option.etd ?? "ETA on dispatch"}
                            {option.chargeWeightKg ? ` · ${option.chargeWeightKg} kg charged` : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-ink">
                          {formatPrice(Math.round(option.rate))}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button onClick={handleShip} loading={busy === "ship"} className="mt-4 w-full" size="lg">
              <Package className="h-4 w-4" strokeWidth={2.4} />
              Create shipment and label
            </Button>

            <div className="mt-5 rounded-3xl bg-surface/80 p-4 hairline">
              <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">
                Or enter tracking yourself
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                For parcels sent by India Post or a local courier. The customer sees this on their order.
              </p>

              <div className="mt-3 space-y-2">
                <input
                  aria-label="Tracking number"
                  placeholder="Tracking number"
                  value={manual.awb}
                  onChange={(event) => setManual({ ...manual, awb: event.target.value })}
                  className={manualFieldClass}
                />
                <input
                  aria-label="Courier name"
                  placeholder="Courier name (optional)"
                  value={manual.courierName}
                  onChange={(event) => setManual({ ...manual, courierName: event.target.value })}
                  className={manualFieldClass}
                />
                <input
                  aria-label="Tracking link"
                  placeholder="Tracking link (optional)"
                  value={manual.trackingUrl}
                  onChange={(event) => setManual({ ...manual, trackingUrl: event.target.value })}
                  className={manualFieldClass}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleManualTracking}
                  loading={busy === "manual"}
                  disabled={manual.awb.trim().length < 3}
                  className="w-full"
                >
                  Save tracking and mark shipped
                </Button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-4">
            <div className="rounded-3xl bg-mint-100/60 p-4">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-mint-400">
                {shipment?.status ?? "Shipment created"}
              </p>
              <p className="mt-1.5 font-mono text-sm font-bold text-ink">{shipment?.awb}</p>
              <p className="mt-0.5 text-xs text-muted">
                {shipment?.courierName ?? "Courier"}
                {shipment?.appliedWeightKg ? ` · ${shipment.appliedWeightKg} kg applied` : ""}
              </p>
              {shipment?.pickupScheduledAt && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted">
                  <CalendarClock className="h-3 w-3 shrink-0" strokeWidth={2.4} />
                  Pickup {formatDate(shipment.pickupScheduledAt)}
                  {shipment.pickupToken ? ` · token ${shipment.pickupToken}` : ""}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              {shipment?.labelUrl && <DocLink href={shipment.labelUrl} label="Shipping label" icon={FileText} />}
              {shipment?.invoiceUrl && <DocLink href={shipment.invoiceUrl} label="Invoice" icon={ScrollText} />}
              {shipment?.manifestUrl && <DocLink href={shipment.manifestUrl} label="Manifest" icon={ScrollText} />}
              {shipment?.trackingUrl && <DocLink href={shipment.trackingUrl} label="Track on Shiprocket" icon={Truck} />}
            </div>

            {isManual && (
              <p className="rounded-3xl bg-peach-100/70 px-4 py-3 text-xs leading-relaxed text-ink-700">
                You entered this tracking by hand, so Shiprocket has no record of it. Labels, invoices,
                manifests and pickups are not available. To cancel, set the order status to Cancelled.
              </p>
            )}

            {!isManual && (
              <div className="grid gap-2 sm:grid-cols-2">
                {!shipment?.invoiceUrl && (
                  <Button variant="secondary" size="sm" onClick={handleInvoice} loading={busy === "invoice"}>
                    Generate invoice
                  </Button>
                )}
                {!shipment?.manifestUrl && (
                  <Button variant="secondary" size="sm" onClick={handleManifest} loading={busy === "manifest"}>
                    Generate manifest
                  </Button>
                )}
              </div>
            )}

            {!isManual && (
            <div className="rounded-3xl bg-surface/80 p-4 hairline">
              <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Schedule a pickup</h3>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <input
                  type="date"
                  aria-label="Pickup date"
                  value={pickupDate}
                  onChange={(event) => setPickupDate(event.target.value)}
                  className="h-9 flex-1 rounded-2xl border-0 bg-surface px-3 text-sm text-ink ring-1 ring-line focus:ring-2 focus:ring-lavender-400"
                />
                <Button variant="secondary" size="sm" onClick={handlePickup} loading={busy === "pickup"}>
                  <CalendarClock className="h-4 w-4" strokeWidth={2.4} />
                  Request
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted">Leave the date blank for the next available slot.</p>
            </div>
            )}

            <div className="rounded-3xl bg-surface/80 p-4 hairline">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint">Live tracking</h3>
                <Button variant="ghost" size="sm" onClick={handleTrack} loading={busy === "track"}>
                  <RefreshCw className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Refresh
                </Button>
              </div>

              {tracking ? (
                tracking.events.length > 0 ? (
                  <ol className="mt-3 space-y-3">
                    {tracking.events.map((event, index) => (
                      <li key={`${event.date}-${index}`} className="flex gap-3">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lavender-400" />
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-ink">
                            {event.statusLabel ?? event.activity ?? event.status ?? "Update"}
                          </span>
                          <span className="block text-[0.6875rem] text-muted">
                            {[formatDate(event.date), event.location].filter(Boolean).join(" · ")}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-muted">
                    {tracking.currentStatus ?? "No scans yet."}
                  </p>
                )
              ) : (
                <p className="mt-2 text-xs text-muted">Refresh to pull the latest courier scans.</p>
              )}
            </div>

            {!isManual && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                loading={busy === "cancel"}
                className="w-full text-rose-500 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4" strokeWidth={2.4} />
                Cancel this shipment
              </Button>
            )}
          </section>
        )}
      </div>
    </Drawer>
  );
}
