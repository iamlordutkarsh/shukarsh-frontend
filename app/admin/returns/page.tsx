"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Image from "next/image";
import { Check, Package, RotateCcw, X } from "lucide-react";
import AdminLayout from "../../../components/AdminLayout";
import { textareaClass } from "../../../components/admin/FormField";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { NoResultsArt } from "../../../components/ui/KawaiiArt";
import { Modal } from "../../../components/ui/Modal";
import { Skeleton } from "../../../components/ui/Skeleton";
import { useToast } from "../../../components/ui/Toast";
import { getReturns, updateReturn } from "../../../lib/api";
import { useAuth } from "../../../lib/auth";
import type { AdminReturn, ReturnStatus } from "../../../lib/types";
import { cn, formatPrice } from "../../../lib/utils";
import {
  formatPlacedAt,
  returnMeta,
  returnOutcomeLabel,
  returnReasonLabel,
} from "../../../components/orders/status";

const TABS: { label: string; status?: ReturnStatus }[] = [
  { label: "Waiting on us", status: "REQUESTED" },
  { label: "Approved", status: "APPROVED" },
  { label: "Back with us", status: "RECEIVED" },
  { label: "Everything", status: undefined },
];

type Decision = "APPROVED" | "REJECTED" | "RECEIVED" | "COMPLETED";

const DECISION_COPY: Record<Decision, { title: string; action: string; hint: string }> = {
  APPROVED: {
    title: "Approve this return",
    action: "Approve it",
    hint: "The customer is told we will arrange a pickup. Book the reverse pickup in Shiprocket, then come back here when the parcel lands.",
  },
  REJECTED: {
    title: "Refuse this return",
    action: "Refuse it",
    hint: "Your note is sent to the customer word for word, so write something they can act on.",
  },
  RECEIVED: {
    title: "The parcel is back",
    action: "Log it as received",
    hint: "Only the pieces you mark as sellable again go back into stock. Anything else is written off.",
  },
  COMPLETED: {
    title: "Close this return",
    action: "Mark it settled",
    hint: "Refund the payment in the Razorpay dashboard first, then close it here. The customer is emailed either way.",
  },
};

export default function AdminReturnsPage() {
  const { token } = useAuth();
  const { toast } = useToast();
  const uid = useId();

  const [tab, setTab] = useState(0);
  // Stamped with what it is a load of, so switching tab shows the skeleton
  // again without a setState on the way into the effect.
  const [loaded, setLoaded] = useState<{ key: string; returns: AdminReturn[] } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadKey = `${tab}:${reloadKey}`;
  const loading = loaded?.key !== loadKey;
  const returns = loaded?.returns ?? [];

  const [pending, setPending] = useState<{ request: AdminReturn; decision: Decision } | null>(null);
  const [note, setNote] = useState("");
  const [resellable, setResellable] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    if (!token) return;
    let active = true;

    getReturns(token, TABS[tab]?.status)
      .then((data) => {
        if (active) setLoaded({ key: loadKey, returns: data.returns });
      })
      .catch((err) => {
        if (!active) return;
        setLoaded({ key: loadKey, returns: [] });
        toast({
          title: "Could not load returns",
          description: err instanceof Error ? err.message : "Please try again in a moment.",
          tone: "error",
        });
      });

    return () => {
      active = false;
    };
  }, [token, tab, loadKey, toast]);

  const start = (request: AdminReturn, decision: Decision) => {
    setPending({ request, decision });
    setNote("");
    // Default to sellable: most returns are refused deliveries or wrong items
    // that never left the box. Damage is the exception you untick.
    setResellable(Object.fromEntries(request.items.map((item) => [item.orderItemId, true])));
  };

  const submit = async () => {
    if (!token || !pending) return;
    const { request, decision } = pending;

    if (decision === "REJECTED" && note.trim().length === 0) return;

    setSaving(true);
    try {
      await updateReturn(token, request.id, {
        status: decision,
        ...(note.trim() ? { adminNote: note.trim() } : {}),
        ...(decision === "RECEIVED"
          ? {
              items: request.items.map((item) => ({
                orderItemId: item.orderItemId,
                resellable: resellable[item.orderItemId] ?? false,
              })),
            }
          : {}),
      });

      toast({
        title: "Return updated",
        description: "The customer has been emailed.",
        tone: "success",
      });
      setPending(null);
      reload();
    } catch (err) {
      toast({
        title: "Could not update this return",
        description: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Returns"
      subtitle="Damaged or wrong items customers have asked to send back."
    >
      <div className="flex flex-wrap gap-2">
        {TABS.map((option, index) => (
          <button
            key={option.label}
            type="button"
            onClick={() => setTab(index)}
            className={cn(
              "rounded-full px-4 py-2 text-xs font-bold transition-colors",
              tab === index
                ? "bg-ink-900 text-white"
                : "bg-surface text-muted ring-1 ring-line hover:text-ink"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-40 rounded-4xl" />
          <Skeleton className="h-40 rounded-4xl" />
        </div>
      ) : returns.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            art={<NoResultsArt />}
            title="Nothing here"
            description={
              TABS[tab]?.status === "REQUESTED"
                ? "No returns are waiting on you. "
                : "No returns in this state yet."
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {returns.map((request) => {
            const meta = returnMeta[request.status] ?? returnMeta.REQUESTED;

            return (
              <li key={request.id} className="rounded-4xl bg-surface/90 p-5 shadow-soft hairline sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink">
                      Order #{request.orderId.slice(0, 8)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {request.order.customerName ?? "Customer"}
                      {request.order.customerEmail ? ` · ${request.order.customerEmail}` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">Asked {formatPlacedAt(request.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-3 py-1 text-[0.625rem] font-bold uppercase tracking-[0.14em]",
                        meta!.className
                      )}
                    >
                      {meta!.label}
                    </span>
                    <span className="text-xs font-semibold text-ink">
                      {returnReasonLabel[request.reason]} · {returnOutcomeLabel[request.outcome]}
                    </span>
                  </div>
                </div>

                <ul className="mt-4 space-y-1.5">
                  {request.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-ink">
                        {item.product?.name ?? "Item"}
                        <span className="text-muted"> × {item.quantity}</span>
                      </span>
                      {item.resellable != null && (
                        <span
                          className={cn(
                            "shrink-0 text-[0.625rem] font-bold uppercase tracking-[0.14em]",
                            item.resellable ? "text-mint-400" : "text-rose-500"
                          )}
                        >
                          {item.resellable ? "Back in stock" : "Written off"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>

                <p className="mt-3 rounded-2xl bg-lavender-50/60 p-3 text-xs leading-relaxed text-muted">
                  <span className="font-semibold text-ink">Their words: </span>
                  {request.customerNote}
                </p>

                {(request.photos ?? []).length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {(request.photos ?? []).map((url, index) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        title="Open full size"
                        className="relative h-20 w-20 overflow-hidden rounded-2xl bg-lavender-50 ring-1 ring-line transition-shadow hover:ring-2 hover:ring-lavender-300"
                      >
                        <Image
                          src={url}
                          alt={`Photo ${index + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                          unoptimized
                        />
                      </a>
                    ))}
                  </div>
                )}

                {request.adminNote && (
                  <p className="mt-2 text-xs leading-relaxed text-muted">
                    <span className="font-semibold text-ink">Your note: </span>
                    {request.adminNote}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <div className="text-xs text-muted">
                    <span className="font-semibold text-ink">
                      {formatPrice(request.refundAmount ?? request.proposedRefund)}
                    </span>
                    {request.refundAmount != null ? " agreed" : " if you approve"}
                    {" · paid "}
                    {formatPrice(request.order.totalAmount)}
                    {request.order.razorpayPaymentId && (
                      <span className="ml-1 block break-all font-mono text-[0.6875rem] text-faint sm:inline">
                        {request.order.razorpayPaymentId}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {request.status === "REQUESTED" && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => start(request, "REJECTED")}>
                          <X className="h-4 w-4" strokeWidth={2.4} />
                          Refuse
                        </Button>
                        <Button variant="dark" size="sm" onClick={() => start(request, "APPROVED")}>
                          <Check className="h-4 w-4" strokeWidth={2.4} />
                          Approve
                        </Button>
                      </>
                    )}
                    {request.status === "APPROVED" && (
                      <Button variant="dark" size="sm" onClick={() => start(request, "RECEIVED")}>
                        <Package className="h-4 w-4" strokeWidth={2.4} />
                        Parcel is back
                      </Button>
                    )}
                    {request.status === "RECEIVED" && (
                      <Button variant="dark" size="sm" onClick={() => start(request, "COMPLETED")}>
                        <RotateCcw className="h-4 w-4" strokeWidth={2.4} />
                        {request.outcome === "REFUND" ? "Refunded" : "Replacement sent"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        label={pending ? DECISION_COPY[pending.decision].title : "Return"}
        className="max-w-lg"
      >
        {pending && (
          <div className="p-6 sm:p-7">
            <h2 className="font-display text-xl text-ink">{DECISION_COPY[pending.decision].title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {DECISION_COPY[pending.decision].hint}
            </p>

            {pending.decision === "APPROVED" && (
              <p className="mt-3 rounded-2xl bg-lavender-50 p-3 text-sm text-ink">
                This agrees to{" "}
                <span className="font-bold">{formatPrice(pending.request.proposedRefund)}</span>
                {pending.request.outcome === "EXCHANGE" ? " worth of goods." : " back to the customer."}
              </p>
            )}

            {pending.decision === "RECEIVED" && (
              <ul className="mt-4 space-y-2">
                {pending.request.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-lavender-50/60 p-3"
                  >
                    <span className="min-w-0 truncate text-sm text-ink">
                      {item.product?.name ?? "Item"}
                      <span className="text-muted"> × {item.quantity}</span>
                    </span>
                    <label className="flex shrink-0 items-center gap-2 text-xs font-semibold text-muted">
                      <input
                        type="checkbox"
                        checked={resellable[item.orderItemId] ?? false}
                        onChange={(event) =>
                          setResellable((current) => ({
                            ...current,
                            [item.orderItemId]: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-line text-lavender-500 focus:ring-lavender-400"
                      />
                      Can sell again
                    </label>
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 space-y-2">
              <label
                htmlFor={`${uid}-note`}
                className="block text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-faint"
              >
                {pending.decision === "REJECTED" ? "Why (the customer reads this)" : "Note (optional)"}
              </label>
              <textarea
                id={`${uid}-note`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                placeholder={
                  pending.decision === "REJECTED"
                    ? "The photos show wear rather than damage in transit..."
                    : "Anything the customer should know."
                }
                className={textareaClass}
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setPending(null)}>
                Never mind
              </Button>
              <Button
                variant="dark"
                size="sm"
                loading={saving}
                disabled={pending.decision === "REJECTED" && note.trim().length === 0}
                onClick={submit}
              >
                {DECISION_COPY[pending.decision].action}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
}
