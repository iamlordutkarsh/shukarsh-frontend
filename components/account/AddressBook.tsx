"use client";

import { MapPin, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteAddress, getAddresses, updateAddress, type SavedAddress } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

/**
 * The addresses this customer has kept, and the two things worth doing to one
 * from here: making it the default, or getting rid of it.
 *
 * Adding and editing happen at checkout, where the address is being typed
 * anyway — a second form here would be a second place to keep in step for a
 * screen most people open once.
 */
export function AddressBook() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    getAddresses(token)
      .then((data) => {
        if (!cancelled) setAddresses(data.addresses);
      })
      .catch(() => {
        if (!cancelled) setAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const makeDefault = async (address: SavedAddress) => {
    if (!token || address.isDefault) return;
    setBusyId(address.id);

    try {
      await updateAddress(token, address.id, {
        name: address.name,
        phone: address.phone,
        line1: address.line1,
        line2: address.line2,
        city: address.city,
        state: address.state,
        zip: address.zip,
        isDefault: true,
      });
      setAddresses((current) =>
        current.map((item) => ({ ...item, isDefault: item.id === address.id }))
      );
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not update",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (address: SavedAddress) => {
    if (!token) return;
    setBusyId(address.id);

    try {
      await deleteAddress(token, address.id);
      // Refetched rather than filtered out, because deleting the default
      // promotes another one and the server decides which.
      const data = await getAddresses(token);
      setAddresses(data.addresses);
    } catch (error) {
      toast({
        tone: "error",
        title: "Could not remove",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  if (!token || loading || addresses.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
        <MapPin className="h-5 w-5 text-lavender-500" strokeWidth={2.3} />
        Saved addresses
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2">
        {addresses.map((address) => (
          <li
            key={address.id}
            className="flex flex-col gap-3 rounded-4xl bg-surface/90 p-5 shadow-soft hairline"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 truncate font-semibold text-ink">
                {address.name}
                {address.isDefault && (
                  <span className="shrink-0 rounded-full bg-lavender-100 px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.12em] text-lavender-700">
                    Default
                  </span>
                )}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {[address.line1, address.line2, address.city, address.state, address.zip]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {address.phone && <p className="mt-1 text-xs text-faint">{address.phone}</p>}
            </div>

            <div className="mt-auto flex gap-2">
              {!address.isDefault && (
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busyId === address.id}
                  onClick={() => void makeDefault(address)}
                >
                  <Star className="h-3.5 w-3.5" strokeWidth={2.4} />
                  Make default
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                loading={busyId === address.id}
                onClick={() => void remove(address)}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={2.4} />
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
