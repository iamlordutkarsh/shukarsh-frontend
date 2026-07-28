"use client";

import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { getDeliveryQuote, lookupPincode, type DeliveryQuote } from "../../lib/api";
import { Button } from "../ui/Button";

const PINCODE = /^[1-9]\d{5}$/;

/**
 * "Where do I send it, and when does it arrive" answered before the cart.
 *
 * Uses the same public serviceability call checkout uses, quoted for one unit
 * of this product, so the estimate a customer sees here is the one they get at
 * checkout rather than a guess.
 */
export function DeliveryCheck({ productId }: { productId: string }) {
  const [pincode, setPincode] = useState("");
  const [place, setPlace] = useState<{ city: string | null; state: string | null } | null>(null);
  const [rates, setRates] = useState<DeliveryQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const valid = PINCODE.test(pincode);

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid) return;

    setLoading(true);
    setError("");
    setRates(null);
    setPlace(null);

    try {
      const [where, quote] = await Promise.all([
        lookupPincode(pincode).catch(() => null),
        getDeliveryQuote({ pincode, items: [{ productId, quantity: 1 }] }),
      ]);
      setPlace(where);
      setRates(quote);
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : "Could not check this PIN code right now.");
    } finally {
      setLoading(false);
    }
  };

  const etaDays = rates?.etdDays ?? null;
  const placeLabel = [place?.city, place?.state].filter(Boolean).join(", ");

  return (
    <section className="rounded-3xl bg-surface/70 p-4 hairline">
      <h2 className="flex items-center gap-2 text-[0.8125rem] font-bold text-ink">
        <Truck className="h-4 w-4 text-lavender-500" strokeWidth={2.4} />
        Check delivery
      </h2>

      <form onSubmit={handleCheck} className="mt-2.5 flex gap-2">
        <input
          inputMode="numeric"
          aria-label="Delivery PIN code"
          placeholder="6 digit PIN code"
          value={pincode}
          onChange={(event) => setPincode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full rounded-2xl border-0 bg-surface px-3.5 py-2.5 text-sm text-ink ring-1 ring-line placeholder:text-faint focus:ring-2 focus:ring-lavender-400"
        />
        <Button type="submit" size="sm" disabled={!valid} loading={loading} className="shrink-0">
          Check
        </Button>
      </form>

      {error && <p className="mt-2.5 text-xs text-rose-500">{error}</p>}

      {rates && !error && (
        <div className="mt-2.5 text-xs leading-relaxed">
          {placeLabel && (
            <p className="flex items-center gap-1.5 font-semibold text-ink">
              <MapPin className="h-3 w-3 shrink-0 text-lavender-500" strokeWidth={2.5} />
              {placeLabel}
            </p>
          )}

          {rates.enabled && !rates.serviceable ? (
            <p className="mt-1 text-rose-500">
              No courier is delivering to {pincode} right now. Try another PIN code.
            </p>
          ) : (
            <p className="mt-1 text-muted">
              {etaDays ? (
                <>
                  Arrives in about{" "}
                  <span className="font-semibold text-ink">
                    {etaDays} day{etaDays === 1 ? "" : "s"}
                  </span>
                  .{" "}
                </>
              ) : (
                "We deliver here. "
              )}
              {rates.freeShipping ? (
                <span className="font-semibold text-mint-400">Delivery is on us.</span>
              ) : (
                <>
                  Delivery <span className="font-semibold text-ink">₹{Math.round(rates.shippingAmount)}</span>
                  {rates.shortfall > 0 && <>, or free once your bag reaches ₹{Math.round(rates.shortfall)} more</>}.
                </>
              )}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
