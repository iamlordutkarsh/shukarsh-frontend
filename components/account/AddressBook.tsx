"use client";

import { MapPin, Plus, Star, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  updateAddress,
  type SavedAddress,
  type SavedAddressInput,
} from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { INDIAN_STATES } from "../../lib/constants";
import { Button } from "../ui/Button";
import { useToast } from "../ui/Toast";

const fieldClass =
  "h-12 w-full rounded-2xl border-0 bg-surface px-4 text-sm text-ink shadow-soft ring-1 ring-line transition-shadow placeholder:text-faint focus:ring-2 focus:ring-lavender-400";

const BLANK = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
  isDefault: false,
};

type Draft = typeof BLANK;

function draftFrom(address: SavedAddress): Draft {
  return {
    name: address.name ?? "",
    phone: address.phone ?? "",
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    zip: address.zip ?? "",
    isDefault: address.isDefault,
  };
}

function toInput(draft: Draft): SavedAddressInput {
  return { ...draft, line2: draft.line2 || null };
}

/**
 * The same rules the server applies, checked here so a wrong number is caught
 * where it was typed instead of coming back as a failed request.
 */
function problemWith(draft: Draft): string | null {
  if (draft.name.trim().length < 3) return "Enter the full name the parcel is for.";
  if (!/^[6-9]\d{9}$/.test(draft.phone)) {
    return "That is not an Indian mobile number — 10 digits starting 6, 7, 8 or 9.";
  }
  if (draft.line1.trim().length < 5) return "The address needs a house or flat and a street.";
  if (!/^[1-9]\d{5}$/.test(draft.zip)) return "A PIN code is 6 digits.";
  if (draft.city.trim().length < 2) return "Which city?";
  if (!draft.state) return "Pick a state.";
  return null;
}

/**
 * The addresses this customer has kept, and everything worth doing to one.
 *
 * Always on screen for a signed-in customer, empty or not. Hiding it until an
 * address existed meant the only way to get a first one saved was to notice a
 * checkbox at checkout, and no way at all to find out the feature was there.
 */
export function AddressBook() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** The id being edited, "new" while adding, or null when the form is shut. */
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(BLANK);
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");

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

  const refresh = async () => {
    if (!token) return;
    const data = await getAddresses(token);
    setAddresses(data.addresses);
  };

  const openNew = () => {
    setDraft(BLANK);
    setProblem("");
    setEditing("new");
  };

  const openEdit = (address: SavedAddress) => {
    setDraft(draftFrom(address));
    setProblem("");
    setEditing(address.id);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) return;

    const wrong = problemWith(draft);
    if (wrong) {
      setProblem(wrong);
      return;
    }

    setProblem("");
    setSaving(true);

    try {
      if (editing === "new") await createAddress(token, toInput(draft));
      else if (editing) await updateAddress(token, editing, toInput(draft));
      await refresh();
      setEditing(null);
      toast({ tone: "success", title: "Address saved" });
    } catch (error) {
      // Shown in the form as well as in a toast: a toast above a long page is
      // easy to miss, and this is the moment somebody needs to read it.
      setProblem(error instanceof Error ? error.message : "Could not save that address.");
    } finally {
      setSaving(false);
    }
  };

  const makeDefault = async (address: SavedAddress) => {
    if (!token || address.isDefault) return;
    setBusyId(address.id);

    try {
      await updateAddress(token, address.id, toInput({ ...draftFrom(address), isDefault: true }));
      await refresh();
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
      await refresh();
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

  if (!token) return null;

  return (
    <section id="addresses" className="space-y-4 scroll-mt-28">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
          <MapPin className="h-5 w-5 text-lavender-500" strokeWidth={2.3} />
          Saved addresses
        </h2>
        {editing === null && (
          <Button variant="secondary" size="sm" onClick={openNew}>
            <Plus className="h-3.5 w-3.5" strokeWidth={2.6} />
            Add
          </Button>
        )}
      </div>

      {editing !== null && (
        <form onSubmit={save} className="space-y-3 rounded-4xl bg-surface/90 p-5 shadow-soft hairline">
          {problem && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-600"
            >
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2.4} />
              {problem}
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              minLength={3}
              aria-label="Full name"
              placeholder="Full name"
              className={fieldClass}
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
            />
            <input
              required
              aria-label="Mobile number"
              placeholder="10 digit mobile number"
              inputMode="numeric"
              pattern="[6-9][0-9]{9}"
              title="An Indian mobile number: 10 digits starting 6, 7, 8 or 9"
              className={fieldClass}
              value={draft.phone}
              onChange={(event) =>
                setDraft({ ...draft, phone: event.target.value.replace(/\D/g, "").slice(0, 10) })
              }
            />
          </div>

          <input
            required
            aria-label="Address"
            placeholder="Flat, house, street"
            className={fieldClass}
            value={draft.line1}
            onChange={(event) => setDraft({ ...draft, line1: event.target.value })}
          />
          <input
            aria-label="Address line 2"
            placeholder="Area, landmark (optional)"
            className={fieldClass}
            value={draft.line2}
            onChange={(event) => setDraft({ ...draft, line2: event.target.value })}
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <input
              required
              aria-label="PIN code"
              placeholder="PIN code"
              inputMode="numeric"
              pattern="[1-9][0-9]{5}"
              title="A 6 digit Indian PIN code"
              className={fieldClass}
              value={draft.zip}
              onChange={(event) =>
                setDraft({ ...draft, zip: event.target.value.replace(/\D/g, "").slice(0, 6) })
              }
            />
            <input
              required
              aria-label="City"
              placeholder="City"
              className={fieldClass}
              value={draft.city}
              onChange={(event) => setDraft({ ...draft, city: event.target.value })}
            />
            <select
              required
              aria-label="State"
              className={fieldClass}
              value={draft.state}
              onChange={(event) => setDraft({ ...draft, state: event.target.value })}
            >
              <option value="">State</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2.5 text-[0.8125rem] text-muted">
            <input
              type="checkbox"
              checked={draft.isDefault}
              onChange={(event) => setDraft({ ...draft, isDefault: event.target.checked })}
            />
            Deliver here by default
          </label>

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" loading={saving}>
              Save address
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {!loading && addresses.length === 0 && editing === null && (
        <p className="rounded-4xl bg-surface-soft px-5 py-4 text-sm leading-relaxed text-muted">
          Nothing saved yet. Add one here, or tick &ldquo;save this address&rdquo; the next time you
          check out, and it will be waiting for your next order.
        </p>
      )}

      {addresses.length > 0 && (
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

              <div className="mt-auto flex flex-wrap gap-2">
                <Button variant="secondary" size="sm" onClick={() => openEdit(address)}>
                  Edit
                </Button>
                {!address.isDefault && (
                  <Button
                    variant="ghost"
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
      )}
    </section>
  );
}
