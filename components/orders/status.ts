import { CheckCircle2, Clock, Package, RotateCcw, Truck, XCircle } from "lucide-react";

/** Shared by the order list row and the order detail page. */
export const statusMeta: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  PENDING: { label: "Pending", icon: Clock, className: "bg-peach-100 text-peach-400" },
  PROCESSING: { label: "Packing", icon: Package, className: "bg-lavender-100 text-lavender-700" },
  SHIPPED: { label: "Shipped", icon: Truck, className: "bg-blush-100 text-blush-500" },
  DELIVERED: { label: "Delivered", icon: CheckCircle2, className: "bg-mint-100 text-mint-400" },
  CANCELLED: { label: "Cancelled", icon: XCircle, className: "bg-rose-50 text-rose-500" },
  RETURNED: { label: "Returned", icon: RotateCcw, className: "bg-rose-50 text-rose-500" },
};

/** Where a return has got to, in words a customer reads rather than our enum. */
export const returnMeta: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: "Waiting on us", className: "bg-peach-100 text-peach-400" },
  APPROVED: { label: "Approved", className: "bg-mint-100 text-mint-400" },
  REJECTED: { label: "Not accepted", className: "bg-rose-50 text-rose-500" },
  RECEIVED: { label: "Back with us", className: "bg-lavender-100 text-lavender-700" },
  COMPLETED: { label: "Settled", className: "bg-mint-100 text-mint-400" },
  WITHDRAWN: { label: "Withdrawn", className: "bg-lavender-50 text-faint" },
};

export const returnReasonLabel: Record<string, string> = {
  DAMAGED: "Arrived damaged",
  WRONG_ITEM: "Wrong item sent",
};

export const returnOutcomeLabel: Record<string, string> = {
  REFUND: "Refund",
  EXCHANGE: "Replacement",
};

export const paymentMeta: Record<string, string> = {
  PAID: "text-mint-400",
  PENDING: "text-peach-400",
  FAILED: "text-rose-500",
  REFUNDED: "text-lavender-700",
};

export const steps = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

/** Full date and time, for the detail a customer expects on an order. */
export function formatPlacedAt(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatEventDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * Couriers send the estimated delivery date in whatever shape they like, so
 * parse it and fall back to printing it verbatim. Splitting on the first space
 * turned "29 Jul 2026 18:00" into "29".
 */
export function formatEtd(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function summaryLineOf(items: { product?: { name?: string } | null }[]) {
  const first = items[0]?.product?.name;
  return items.length > 1 ? `${first ?? "Item"} +${items.length - 1} more` : first ?? "Item";
}
