"use client";

import { Check, MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { getAddresses, type SavedAddress } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { cn } from "../../lib/utils";

export interface AddressFields {
  name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
}

export function addressToFields(address: SavedAddress): AddressFields {
  return {
    name: address.name ?? "",
    phone: address.phone ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    zip: address.zip ?? "",
  };
}

/** "12 Rose Lane, Bareilly 243001" — enough to tell two of them apart. */
function summarise(address: SavedAddress): string {
  return [address.line1, address.city, address.zip].filter(Boolean).join(", ");
}

/**
 * Addresses this customer has used before, if any.
 *
 * Renders nothing at all for a guest or for somebody with an empty book, so the
 * checkout looks exactly as it does today until there is something to offer.
 * A failure to load is also nothing: the form underneath still works, and an
 * error about a convenience is noise on the page where somebody is paying.
 */
export function SavedAddresses({
  selectedId,
  onSelect,
  onUseNew,
}: {
  selectedId: string | null;
  onSelect: (address: SavedAddress) => void;
  onUseNew: () => void;
}) {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getAddresses(token)
      .then((data) => {
        if (cancelled) return;
        setAddresses(data.addresses);
        const preferred = data.addresses.find((address) => address.isDefault);
        if (preferred) onSelect(preferred);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      });

    return () => {
      cancelled = true;
    };
    // Once per sign-in. onSelect is a fresh closure on every checkout render and
    // listing it here would refetch the book on every keystroke in the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!token || addresses.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-faint">Deliver to</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {addresses.map((address) => {
          const active = address.id === selectedId;
          return (
            <button
              key={address.id}
              type="button"
              onClick={() => onSelect(address)}
              aria-pressed={active}
              className={cn(
                "flex items-start gap-2.5 rounded-3xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-lavender-400 bg-lavender-50"
                  : "border-line-strong bg-surface hover:border-lavender-300"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                  active ? "bg-lavender-500 text-white" : "bg-surface-soft text-faint"
                )}
              >
                {active ? <Check className="h-3 w-3" strokeWidth={3} /> : <MapPin className="h-3 w-3" strokeWidth={2.6} />}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-ink">{address.name}</span>
                <span className="mt-0.5 block truncate text-xs text-muted">{summarise(address)}</span>
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={onUseNew}
          aria-pressed={selectedId === null}
          className={cn(
            "flex items-center gap-2.5 rounded-3xl border border-dashed px-4 py-3 text-left transition-colors",
            selectedId === null
              ? "border-lavender-400 bg-lavender-50"
              : "border-line-strong hover:border-lavender-300"
          )}
        >
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-surface-soft text-faint">
            <Plus className="h-3 w-3" strokeWidth={3} />
          </span>
          <span className="text-sm font-semibold text-ink">Somewhere else</span>
        </button>
      </div>
    </div>
  );
}
