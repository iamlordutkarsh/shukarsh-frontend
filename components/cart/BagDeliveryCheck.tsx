"use client";

import { useState } from "react";
import { MapPin, Truck } from "lucide-react";
import { getShippingRates, lookupPincode, type ShippingRates } from "../../lib/api";
import { Button } from "../ui/Button";

const PINCODE = /^[1-9]\d{5}$/;

export interface BagDeliveryQuote {
  /** The bag this was quoted for. Anything else on screen makes it stale. */
  key: string;
  rates: ShippingRates;
}

interface BagDeliveryCheckProps {
  items: { productId: string; quantity: number }[];
  cartKey: string;
  onResult: (quote: BagDeliveryQuote) => void;
}

interface CheckResult {
  key: string;
  pincode: string;
  place: { city: string | null; state: string | null } | null;
  rates: ShippingRates | null;
  error: string;
}

/**
 * "When does it arrive" answered from inside the bag, for the whole bag.
 *
 * Same serviceability call checkout makes, quoted for every line rather than a
 * single product, so the date here is the one the order will actually get.
 * It reports the quote back up because whether shipping is free is a fact the
 * price summary needs and only the courier response knows.
 */
export function BagDeliveryCheck({ items, cartKey, onResult }: BagDeliveryCheckProps) {
  const [expanded, setExpanded] = useState(false);
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);

  const valid = PINCODE.test(pincode);

  /**
   * Quantities move while the drawer is open. An estimate quoted for the old
   * bag would keep showing a delivery date that no longer belongs to it, so it
   * is matched against the bag rather than cleared when the bag changes.
   */
  const settled = result?.key === cartKey ? result : null;

  const handleCheck = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!valid || items.length === 0) return;

    const key = cartKey;
    setLoading(true);
    setResult(null);

    try {
      const [place, rates] = await Promise.all([
        lookupPincode(pincode).catch(() => null),
        getShippingRates({ pincode, items }),
      ]);
      setResult({ key, pincode, place, rates, error: "" });
      onResult({ key, rates });
    } catch (checkError) {
      setResult({
        key,
        pincode,
        place: null,
        rates: null,
        error: checkError instanceof Error ? checkError.message : "Could not check this PIN code right now.",
      });
    } finally {
      setLoading(false);
    }
  };

  const rates = settled?.rates ?? null;
  const best = rates?.options?.[0] ?? null;
  const placeLabel = [settled?.place?.city, settled?.place?.state].filter(Boolean).join(", ");

  return (
    <section className="rounded-3xl bg-surface/80 p-4 shadow-soft hairline">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-[0.8125rem] font-bold text-ink">
          <Truck className="h-4 w-4 shrink-0 text-lavender-500" strokeWidth={2.4} />
          Check delivery date
        </h3>

        {!expanded && (
          <Button type="button" variant="secondary" size="sm" onClick={() => setExpanded(true)} className="shrink-0">
            Enter PIN code
          </Button>
        )}
      </div>

      {expanded && (
        <>
          <form onSubmit={handleCheck} className="mt-3 flex gap-2">
            <input
              autoFocus
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

          {settled?.error && <p className="mt-2.5 text-xs text-rose-500">{settled.error}</p>}

          {rates && (
            <div className="mt-2.5 text-xs leading-relaxed">
              {placeLabel && (
                <p className="flex items-center gap-1.5 font-semibold text-ink">
                  <MapPin className="h-3 w-3 shrink-0 text-lavender-500" strokeWidth={2.5} />
                  {placeLabel}
                </p>
              )}

              {!rates.enabled || rates.freeShipping ? (
                <p className="mt-1 text-muted">Delivery is on us for this bag.</p>
              ) : !rates.serviceable ? (
                <p className="mt-1 text-rose-500">
                  No courier is delivering to {settled?.pincode} right now. Try another PIN code.
                </p>
              ) : best ? (
                <p className="mt-1 text-muted">
                  Arrives in about{" "}
                  <span className="font-semibold text-ink">
                    {best.etdDays ? `${best.etdDays} day${best.etdDays === 1 ? "" : "s"}` : best.etd ?? "a few days"}
                  </span>{" "}
                  with {best.courierName}.
                </p>
              ) : (
                <p className="mt-1 text-muted">We deliver here. Rates are shown at checkout.</p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
