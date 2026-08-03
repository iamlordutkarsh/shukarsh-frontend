"use client";

import { Printer, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { getOrder } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { SHOP, addressLines } from "../../lib/shop";
import { stateWithCode } from "../../lib/state-codes";
import type { Order } from "../../lib/types";
import { formatPrice } from "../../lib/utils";
import { Button } from "../ui/Button";

function formatDate(value?: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * The tax invoice, laid out to be printed and put in the parcel.
 *
 * Everything on it is read from the order rather than recomputed: the rate, the
 * taxable value and the tax were all snapshotted when the sale happened, and an
 * invoice that recalculates them would quietly disagree with the one already in
 * a customer's hands the first time a rate or a price changed.
 */
export function Invoice({ orderId }: { orderId: string }) {
  const { token, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !token) return;

    let cancelled = false;
    getOrder(token, orderId)
      .then((data) => {
        if (!cancelled) setOrder(data.order);
      })
      .catch((problem: unknown) => {
        if (!cancelled) {
          setError(problem instanceof Error ? problem.message : "Could not load this order.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token, orderId, authLoading]);

  // Derived rather than set from the effect: signing out is not a fetch failure,
  // and there is nothing to load until the session has settled.
  if (!authLoading && !token) {
    return (
      <p className="mx-auto mt-16 flex max-w-md items-start gap-2 rounded-3xl bg-surface-soft px-5 py-4 text-sm text-muted">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-lavender-500" strokeWidth={2.4} />
        Sign in to view this invoice.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-lavender-200 border-t-lavender-500" />
        <p className="text-sm text-muted">Fetching the invoice…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <p className="mx-auto mt-16 flex max-w-md items-start gap-2 rounded-3xl bg-rose-50 px-5 py-4 text-sm text-rose-600">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
        {error || "Order not found."}
      </p>
    );
  }

  // An order that has not been paid for is not a supply, and rule 46 has nothing
  // to number. Saying so beats printing a document that looks official.
  if (!order.invoiceNumber) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-3xl bg-surface-soft px-5 py-4 text-sm leading-relaxed text-muted">
        <p className="font-semibold text-ink">No invoice for this order yet.</p>
        <p className="mt-1">
          A tax invoice is raised once payment is confirmed, or straight away for a cash order. This
          one is still {order.paymentStatus.toLowerCase()}.
        </p>
      </div>
    );
  }

  const address = order.shippingAddress ?? {};
  const interState = order.igstTotal > 0;

  /**
   * Two blocks, each of which adds up to the same total from a different side.
   *
   * The charges are what was agreed: MRP, less the discount, plus delivery and
   * any cash collection fee. The GST block is that same total split into what
   * the shop keeps and what the government gets, because these prices are
   * tax-inclusive and nothing is being added on top.
   *
   * They cannot be mixed. `taxableAmount` on a line is already net of the
   * discount, so listing it beside a discount row subtracts the coupon twice and
   * the column comes up short by exactly that amount — on the one document where
   * the arithmetic has to survive somebody checking it.
   */
  const taxTotal = order.cgstTotal + order.sgstTotal + order.igstTotal;
  const taxableTotal = order.totalAmount - taxTotal;
  const discounted = order.discountTotal > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <h1 className="font-display text-2xl text-ink">Tax invoice</h1>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="h-4 w-4" strokeWidth={2.4} />
          Print
        </Button>
      </div>

      <article className="rounded-3xl bg-white p-8 text-[0.8125rem] leading-relaxed text-ink shadow-soft print:rounded-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line pb-5">
          <div>
            <p className="font-display text-xl">{SHOP.legalName}</p>
            {addressLines().map((line) => (
              <p key={line} className="text-muted">
                {line}
              </p>
            ))}
            <p className="mt-1.5">
              <span className="text-muted">GSTIN </span>
              <span className="font-mono font-semibold">{SHOP.gstin || "—"}</span>
            </p>
            <p className="text-muted">{SHOP.email}</p>
          </div>

          <div className="text-right">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
              Tax invoice
            </p>
            <p className="mt-1 font-mono text-base font-bold">{order.invoiceNumber}</p>
            <p className="mt-1 text-muted">Dated {formatDate(order.invoicedAt ?? order.createdAt)}</p>
            <p className="text-muted">Order {order.id.slice(0, 8).toUpperCase()}</p>
          </div>
        </header>

        <section className="grid gap-6 border-b border-line py-5 sm:grid-cols-2">
          <div>
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
              Billed to
            </p>
            <p className="mt-1.5 font-semibold">{address.name ?? order.customerName ?? "—"}</p>
            {[address.line1, address.line2, [address.city, address.zip].filter(Boolean).join(" ")]
              .filter(Boolean)
              .map((line) => (
                <p key={line} className="text-muted">
                  {line}
                </p>
              ))}
            {address.phone && <p className="text-muted">{address.phone}</p>}
            {order.customerEmail && <p className="text-muted">{order.customerEmail}</p>}
          </div>

          <div className="sm:text-right">
            <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
              Place of supply
            </p>
            <p className="mt-1.5 font-semibold">
              {stateWithCode(order.placeOfSupply ?? address.state)}
            </p>
            <p className="mt-1 text-muted">
              {interState ? "Inter-state supply · IGST" : "Intra-state supply · CGST + SGST"}
            </p>
            <p className="text-muted">
              {order.paymentMethod === "COD" ? "Cash on delivery" : "Paid online"}
            </p>
          </div>
        </section>

        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[0.6875rem] uppercase tracking-[0.1em] text-muted">
              <th className="py-2.5 font-bold">Description</th>
              <th className="py-2.5 font-bold">HSN</th>
              <th className="py-2.5 text-right font-bold">Qty</th>
              {discounted && <th className="py-2.5 text-right font-bold">MRP</th>}
              <th className="py-2.5 text-right font-bold">Taxable</th>
              <th className="py-2.5 text-right font-bold">Rate</th>
              <th className="py-2.5 text-right font-bold">{interState ? "IGST" : "CGST + SGST"}</th>
              <th className="py-2.5 text-right font-bold">Charged</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const chosen = [item.variantColour, item.variantLabel].filter(Boolean).join(" · ");
              // Taxable and tax are both net of the line's share of the coupon,
              // so this is what was actually charged for it. The MRP column
              // beside it is what it would have cost without the code, and the
              // two only differ on a discounted order.
              const charged = item.taxableAmount + item.taxAmount;
              return (
                <tr key={item.id} className="border-b border-line/60 align-top">
                  <td className="py-2.5">
                    {item.product?.name ?? "Item"}
                    {chosen && <span className="block text-xs text-muted">{chosen}</span>}
                  </td>
                  <td className="py-2.5 font-mono text-xs">{item.product?.hsn ?? "—"}</td>
                  <td className="py-2.5 text-right">{item.quantity}</td>
                  {discounted && (
                    <td className="py-2.5 text-right text-muted">
                      {formatPrice(item.price * item.quantity, true)}
                    </td>
                  )}
                  <td className="py-2.5 text-right">{formatPrice(item.taxableAmount, true)}</td>
                  <td className="py-2.5 text-right">{item.gstRate}%</td>
                  <td className="py-2.5 text-right">
                    {interState
                      ? formatPrice(item.taxAmount, true)
                      : `${formatPrice(item.taxAmount / 2, true)} × 2`}
                  </td>
                  <td className="py-2.5 text-right font-semibold">{formatPrice(charged, true)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <section className="mt-5 flex justify-end">
          <dl className="w-full max-w-xs space-y-1.5">
            <Row label="Items" value={formatPrice(order.itemsTotal, true)} />
            {order.discountTotal > 0 && (
              <Row
                label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`}
                value={`− ${formatPrice(order.discountTotal, true)}`}
              />
            )}
            <Row label="Delivery" value={formatPrice(order.shippingAmount, true)} />
            {order.codFee > 0 && <Row label="Cash collection" value={formatPrice(order.codFee, true)} />}
            <div className="flex items-baseline justify-between border-t border-line pt-2 text-base font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.totalAmount, true)}</dd>
            </div>

            <div className="!mt-3 space-y-1.5 border-t border-line pt-2.5">
              <p className="text-[0.6875rem] font-bold uppercase tracking-[0.16em] text-muted">
                GST included in the total
              </p>
              <Row label="Taxable value" value={formatPrice(taxableTotal, true)} />
              {interState ? (
                <Row label="IGST" value={formatPrice(order.igstTotal, true)} />
              ) : (
                <>
                  <Row label="CGST" value={formatPrice(order.cgstTotal, true)} />
                  <Row label="SGST" value={formatPrice(order.sgstTotal, true)} />
                </>
              )}
            </div>
          </dl>
        </section>

        <footer className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-muted">
          <p>
            Prices are inclusive of GST. The tax shown is the amount already contained in the total,
            not an addition to it.
          </p>
          <p className="mt-1">
            This is a computer generated invoice and does not require a signature.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
